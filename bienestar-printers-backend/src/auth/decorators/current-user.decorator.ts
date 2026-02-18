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
        areaId: user.internal.department_id?.toString() || user.internal.unit_id?.toString(),
        unitId: user.internal.unit_id?.toString(),
        departmentId: user.internal.department_id?.toString(),
        regionId: user.internal.region_id?.toString(),
      };
    }

    return key ? user[key] : user;
  },
);
