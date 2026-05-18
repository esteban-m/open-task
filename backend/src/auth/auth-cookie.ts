import type { CookieOptions } from 'express';

const isProduction = process.env.NODE_ENV === 'production';

/** Cookie refresh httpOnly — cross-origin en prod (front/API sur domaines ou ports différents). */
export const REFRESH_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: isProduction || process.env.COOKIE_SECURE === 'true',
  sameSite: isProduction ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

export const REFRESH_COOKIE_CLEAR_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: isProduction || process.env.COOKIE_SECURE === 'true',
  sameSite: isProduction ? 'none' : 'lax',
  path: '/',
};
