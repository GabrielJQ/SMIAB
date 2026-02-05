import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedUser } from '../types/authenticated-user.type';

export const CurrentUser = createParamDecorator(
  (
    key: keyof AuthenticatedUser | undefined,
    ctx: ExecutionContext,
  ) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;

    if (!user) return null;

    if (key === 'internal' && user.internal) {
      return {
        ...user.internal,
        areaId: user.internal.area_id,
      };
    }

    return key ? user[key] : user;
  },
);
