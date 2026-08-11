import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import {
  SESSION_COOKIE,
  type AuthenticatedRequest,
  type SessionTokenPayload,
} from '../types/request-user';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Not signed in');
    }

    try {
      const payload = await this.jwt.verifyAsync<SessionTokenPayload>(token);
      request.user = { userId: payload.sub, workspaceId: payload.workspaceId };
      return true;
    } catch {
      throw new UnauthorizedException('Session is invalid or has expired');
    }
  }

  private extractToken(request: AuthenticatedRequest): string | undefined {
    const cookies = request.cookies as Record<string, string> | undefined;
    const fromCookie = cookies?.[SESSION_COOKIE];
    if (fromCookie) return fromCookie;

    const [scheme, value] = request.headers.authorization?.split(' ') ?? [];
    return scheme === 'Bearer' ? value : undefined;
  }
}
