import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { SessionGuard } from './session.guard';
import { SESSION_COOKIE, type AuthenticatedRequest } from '../types/request-user';

function contextFor(request: Partial<AuthenticatedRequest>) {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as ExecutionContext;
}

describe('SessionGuard', () => {
  let jwt: { verifyAsync: jest.Mock };
  let guard: SessionGuard;

  beforeEach(() => {
    jwt = {
      verifyAsync: jest
        .fn()
        .mockResolvedValue({ sub: 'user-1', workspaceId: 'workspace-1' }),
    };
    guard = new SessionGuard(jwt as unknown as JwtService);
  });

  it('accepts the session cookie and attaches the user', async () => {
    const request = { cookies: { [SESSION_COOKIE]: 'token' }, headers: {} };

    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
    expect((request as AuthenticatedRequest).user).toEqual({
      userId: 'user-1',
      workspaceId: 'workspace-1',
    });
  });

  it('falls back to the bearer header when there is no cookie', async () => {
    const request = { cookies: {}, headers: { authorization: 'Bearer token' } };

    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
    expect(jwt.verifyAsync).toHaveBeenCalledWith('token');
  });

  it('rejects a request with no token at all', async () => {
    await expect(
      guard.canActivate(contextFor({ cookies: {}, headers: {} })),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('ignores an authorization header that is not a bearer token', async () => {
    await expect(
      guard.canActivate(
        contextFor({ cookies: {}, headers: { authorization: 'Basic abc' } }),
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects a token the signer will not verify', async () => {
    jwt.verifyAsync.mockRejectedValue(new Error('bad signature'));

    await expect(
      guard.canActivate(
        contextFor({ cookies: { [SESSION_COOKIE]: 'tampered' }, headers: {} }),
      ),
    ).rejects.toThrow(UnauthorizedException);
  });
});
