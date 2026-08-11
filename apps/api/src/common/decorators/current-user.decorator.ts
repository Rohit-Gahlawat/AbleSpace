import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import type { AuthenticatedRequest, RequestUser } from '../types/request-user';

export const CurrentUser = createParamDecorator(
  (data: keyof RequestUser | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    return data ? request.user?.[data] : request.user;
  },
);
