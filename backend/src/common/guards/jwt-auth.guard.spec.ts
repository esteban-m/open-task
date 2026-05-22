import { UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  const guard = new JwtAuthGuard();

  it('returns user when authenticated', () => {
    const user = { id: 'user-1' };
    expect(guard.handleRequest(null, user)).toEqual(user);
  });

  it('throws UnauthorizedException when user is missing', () => {
    expect(() => guard.handleRequest(null, null)).toThrow(UnauthorizedException);
  });

  it('rethrows provided error', () => {
    const err = new Error('jwt malformed');
    expect(() => guard.handleRequest(err, null)).toThrow(err);
  });
});
