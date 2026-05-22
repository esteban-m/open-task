describe('auth-cookie', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    delete process.env.COOKIE_SECURE;
  });

  it('uses lax sameSite in development', () => {
    process.env.NODE_ENV = 'development';
    jest.isolateModules(() => {
      const mod = require('./auth-cookie') as typeof import('./auth-cookie');
      expect(mod.REFRESH_COOKIE_OPTIONS.sameSite).toBe('lax');
      expect(mod.REFRESH_COOKIE_OPTIONS.secure).toBe(false);
      expect(mod.REFRESH_COOKIE_CLEAR_OPTIONS.httpOnly).toBe(true);
      expect(mod.REFRESH_COOKIE_OPTIONS.maxAge).toBeGreaterThan(0);
    });
  });

  it('uses none sameSite and secure in production', () => {
    process.env.NODE_ENV = 'production';
    jest.isolateModules(() => {
      const mod = require('./auth-cookie') as typeof import('./auth-cookie');
      expect(mod.REFRESH_COOKIE_OPTIONS.sameSite).toBe('none');
      expect(mod.REFRESH_COOKIE_OPTIONS.secure).toBe(true);
      expect(mod.REFRESH_COOKIE_CLEAR_OPTIONS.path).toBe('/');
    });
  });

  it('honours COOKIE_SECURE outside production', () => {
    process.env.NODE_ENV = 'development';
    process.env.COOKIE_SECURE = 'true';
    jest.isolateModules(() => {
      const mod = require('./auth-cookie') as typeof import('./auth-cookie');
      expect(mod.REFRESH_COOKIE_OPTIONS.secure).toBe(true);
    });
  });
});
