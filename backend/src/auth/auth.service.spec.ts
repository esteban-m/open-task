import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { hashRefreshToken } from './refresh-token-hash';

const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock_token'),
  verify: jest.fn(),
};

const mockConfigService = {
  get: jest.fn().mockReturnValue('test_secret'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Jean',
      lastName: 'Dupont',
    };

    it('devrait créer un compte avec succès', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: 'user-1',
        email: registerDto.email,
      });
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(mockPrismaService.user.create).toHaveBeenCalledTimes(1);
    });

    it('devrait lever une BadRequestException générique si l\'email est déjà utilisé', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(service.register(registerDto)).rejects.toThrow(BadRequestException);
      await expect(service.register(registerDto)).rejects.toThrow(
        /Impossible de créer le compte/,
      );
    });

    it('devrait hacher le mot de passe avant de le sauvegarder', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({ id: 'user-1', email: registerDto.email });
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      await service.register(registerDto);

      const createCall = mockPrismaService.user.create.mock.calls[0][0];
      expect(createCall.data.password).not.toBe(registerDto.password);
      const isHashed = await bcrypt.compare(registerDto.password, createCall.data.password);
      expect(isHashed).toBe(true);
    });
  });

  describe('login', () => {
    const loginDto = { email: 'test@example.com', password: 'password123' };
    const hashedPassword = bcrypt.hashSync('password123', 10);

    it('devrait connecter un utilisateur avec des identifiants valides', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: loginDto.email,
        password: hashedPassword,
      });
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('devrait lever une UnauthorizedException si l\'utilisateur n\'existe pas', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('devrait lever une UnauthorizedException si le mot de passe est incorrect', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: loginDto.email,
        password: bcrypt.hashSync('autre_mdp', 10),
      });

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('devrait lever une UnauthorizedException si le token est manquant', async () => {
      await expect(service.refresh('')).rejects.toThrow(UnauthorizedException);
    });

    it('devrait lever une UnauthorizedException si le token est invalide', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('invalid token');
      });

      await expect(service.refresh('invalid_token')).rejects.toThrow(UnauthorizedException);
    });

    it('devrait rejeter un refresh expiré en base', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'user-1', email: 'test@example.com' });
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        token: hashRefreshToken('expired'),
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(service.refresh('expired')).rejects.toThrow(UnauthorizedException);
    });

    it('devrait rejeter si deleteMany ne supprime aucun token (rotation parallèle)', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'user-1', email: 'test@example.com' });
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        token: hashRefreshToken('stale'),
        expiresAt: new Date(Date.now() + 86_400_000),
      });
      mockPrismaService.refreshToken.deleteMany.mockResolvedValue({ count: 0 });

      await expect(service.refresh('stale')).rejects.toThrow(UnauthorizedException);
    });

    it('devrait renouveler les tokens quand le refresh est valide', async () => {
      const refreshToken = 'valid-refresh-token';
      mockJwtService.verify.mockReturnValue({ sub: 'user-1', email: 'test@example.com' });
      mockJwtService.sign.mockReturnValueOnce('new_access').mockReturnValueOnce('new_refresh');
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        token: hashRefreshToken(refreshToken),
        expiresAt: new Date(Date.now() + 86_400_000),
      });
      mockPrismaService.refreshToken.deleteMany.mockResolvedValue({ count: 1 });
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      const result = await service.refresh(refreshToken);

      expect(result.accessToken).toBe('new_access');
      expect(result.refreshToken).toBe('new_refresh');
    });
  });

  describe('logout', () => {
    it('supprime le refresh token en base', async () => {
      mockPrismaService.refreshToken.deleteMany.mockResolvedValue({ count: 1 });
      await service.logout('refresh');
      expect(mockPrismaService.refreshToken.deleteMany).toHaveBeenCalled();
    });
  });

  describe('getMe', () => {
    it('lève si l’utilisateur n’existe plus', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(service.getMe('ghost')).rejects.toThrow(UnauthorizedException);
    });

    it('retourne le profil utilisateur', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'Jean',
        lastName: 'Dupont',
        createdAt: new Date(),
      });

      const user = await service.getMe('user-1');
      expect(user.email).toBe('test@example.com');
    });
  });
});
