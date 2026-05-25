import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { REFRESH_COOKIE_CLEAR_OPTIONS, REFRESH_COOKIE_OPTIONS } from './auth-cookie';

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  refresh: jest.fn(),
  logout: jest.fn(),
  getMe: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get(AuthController);
    jest.clearAllMocks();
  });

  function mockResponse() {
    return { cookie: jest.fn(), clearCookie: jest.fn() };
  }

  it('register sets refresh cookie and returns access token', async () => {
    mockAuthService.register.mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'refresh',
    });
    const res = mockResponse();

    const result = await controller.register(
      { email: 'a@b.fr', password: 'secret12', firstName: 'A', lastName: 'B' },
      res as any,
    );

    expect(result).toEqual({ accessToken: 'access' });
    expect(res.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'refresh',
      REFRESH_COOKIE_OPTIONS,
    );
  });

  it('login sets refresh cookie', async () => {
    mockAuthService.login.mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'refresh',
    });
    const res = mockResponse();

    await controller.login({ email: 'a@b.fr', password: 'secret12' }, res as any);

    expect(res.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'refresh',
      REFRESH_COOKIE_OPTIONS,
    );
  });

  it('logout clears refresh cookie', async () => {
    mockAuthService.logout.mockResolvedValue(undefined);
    const res = mockResponse();
    const req = { cookies: { refresh_token: 'rt' } };

    const result = await controller.logout(req as any, res as any);

    expect(result).toEqual({ message: 'Déconnexion réussie' });
    expect(res.clearCookie).toHaveBeenCalledWith(
      'refresh_token',
      REFRESH_COOKIE_CLEAR_OPTIONS,
    );
  });

  it('refresh rotates cookie and returns access token', async () => {
    mockAuthService.refresh.mockResolvedValue({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    });
    const res = mockResponse();
    const req = { cookies: { refresh_token: 'old-refresh' } };

    const result = await controller.refresh(req as any, res as any);

    expect(result).toEqual({ accessToken: 'new-access' });
    expect(mockAuthService.refresh).toHaveBeenCalledWith('old-refresh');
    expect(res.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'new-refresh',
      REFRESH_COOKIE_OPTIONS,
    );
  });

  it('getMe delegates to AuthService', async () => {
    mockAuthService.getMe.mockResolvedValue({ id: 'u1', email: 'a@b.fr' });

    const user = await controller.getMe('u1');

    expect(user).toEqual({ id: 'u1', email: 'a@b.fr' });
    expect(mockAuthService.getMe).toHaveBeenCalledWith('u1');
  });
});

describe('AUTH_THROTTLE_LIMIT', () => {
  const originalDemo = process.env.PLAYWRIGHT_DEMO;

  afterEach(() => {
    if (originalDemo === undefined) delete process.env.PLAYWRIGHT_DEMO;
    else process.env.PLAYWRIGHT_DEMO = originalDemo;
    jest.resetModules();
  });

  it('relaxe la limite en mode démo Playwright', async () => {
    process.env.PLAYWRIGHT_DEMO = '1';
    jest.resetModules();
    const { AUTH_THROTTLE_LIMIT } = await import('./auth.controller');
    expect(AUTH_THROTTLE_LIMIT).toBe(500);
  });
});
