import { createHash } from 'crypto';

/** Empreinte SHA-256 du refresh token (stockage en base, pas le JWT en clair). */
export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
