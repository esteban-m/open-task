import { hashRefreshToken } from './refresh-token-hash';

describe('hashRefreshToken', () => {
  it('returns a stable SHA-256 hex digest', () => {
    const a = hashRefreshToken('refresh-token-value');
    const b = hashRefreshToken('refresh-token-value');
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it('differs for different tokens', () => {
    expect(hashRefreshToken('one')).not.toBe(hashRefreshToken('two'));
  });
});
