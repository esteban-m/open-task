import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../prisma/prisma.service';

describe('JwtStrategy', () => {
  const mockPrisma = {
    user: { findUnique: jest.fn() },
  };
  const mockConfig = {
    get: jest.fn().mockReturnValue('test-secret'),
  };

  let strategy: JwtStrategy;

  beforeEach(() => {
    strategy = new JwtStrategy(
      mockConfig as unknown as ConfigService,
      mockPrisma as unknown as PrismaService,
    );
    jest.clearAllMocks();
  });

  it('returns user payload when found', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'a@b.fr',
    });

    const result = await strategy.validate({ sub: 'user-1', email: 'a@b.fr' });

    expect(result).toEqual({ id: 'user-1', email: 'a@b.fr' });
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-1' } });
  });

  it('throws when user no longer exists', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(strategy.validate({ sub: 'missing', email: 'x@x.fr' })).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
