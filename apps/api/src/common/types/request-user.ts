import type { Request } from 'express';

export type RequestUser = {
  userId: string;
  workspaceId: string;
};

export type AuthenticatedRequest = Request & { user?: RequestUser };

export type SessionTokenPayload = {
  sub: string;
  workspaceId: string;
};

export const SESSION_COOKIE = 'pyramid_session';
