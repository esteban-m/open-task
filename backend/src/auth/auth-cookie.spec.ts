import {
  buildRefreshCookieClearOptions,
  buildRefreshCookieOptions,
  REFRESH_COOKIE_CLEAR_OPTIONS,
  REFRESH_COOKIE_OPTIONS,
} from './auth-cookie';

describe('auth-cookie', () => {
  it('uses lax sameSite in development', () => {
    const options = buildRefreshCookieOptions({ NODE_ENV: 'development' });
    const clear = buildRefreshCookieClearOptions({ NODE_ENV: 'development' });

    expect(options.sameSite).toBe('lax');
    expect(options.secure).toBe(false);
    expect(clear.httpOnly).toBe(true);
    expect(options.maxAge).toBeGreaterThan(0);
  });

  it('uses none sameSite and secure in production', () => {
    const options = buildRefreshCookieOptions({ NODE_ENV: 'production' });
    const clear = buildRefreshCookieClearOptions({ NODE_ENV: 'production' });

    expect(options.sameSite).toBe('none');
    expect(options.secure).toBe(true);
    expect(clear.path).toBe('/');
  });

  it('honours COOKIE_SECURE outside production', () => {
    const options = buildRefreshCookieOptions({
      NODE_ENV: 'development',
      COOKIE_SECURE: 'true',
    });

    expect(options.secure).toBe(true);
  });

  it('exports module-level defaults', () => {
    expect(REFRESH_COOKIE_OPTIONS.httpOnly).toBe(true);
    expect(REFRESH_COOKIE_CLEAR_OPTIONS.path).toBe('/');
  });
});
