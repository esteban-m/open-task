import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  const guard = new JwtAuthGuard();

  it('canActivate délègue au guard passport', () => {
    const ctx = {} as ExecutionContext;
    const parent = jest
      .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
      .mockReturnValue(true);
    expect(guard.canActivate(ctx)).toBe(true);
    expect(parent).toHaveBeenCalledWith(ctx);
    parent.mockRestore();
  });

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
