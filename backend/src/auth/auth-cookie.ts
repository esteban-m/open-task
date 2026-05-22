import type { CookieOptions } from 'express';

type CookieEnv = {
  NODE_ENV?: string;
  COOKIE_SECURE?: string;
};

function isProductionEnv(env: CookieEnv) {
  return env.NODE_ENV === 'production';
}

function isSecureCookie(env: CookieEnv) {
  return isProductionEnv(env) || env.COOKIE_SECURE === 'true';
}

/** Cookie refresh httpOnly — cross-origin en prod (front/API sur domaines ou ports différents). */
export function buildRefreshCookieOptions(env: CookieEnv = process.env): CookieOptions {
  const production = isProductionEnv(env);
  return {
    httpOnly: true,
    secure: isSecureCookie(env),
    sameSite: production ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };
}

export function buildRefreshCookieClearOptions(env: CookieEnv = process.env): CookieOptions {
  const production = isProductionEnv(env);
  return {
    httpOnly: true,
    secure: isSecureCookie(env),
    sameSite: production ? 'none' : 'lax',
    path: '/',
  };
}

export const REFRESH_COOKIE_OPTIONS = buildRefreshCookieOptions();
export const REFRESH_COOKIE_CLEAR_OPTIONS = buildRefreshCookieClearOptions();
