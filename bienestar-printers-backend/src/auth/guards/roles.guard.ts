import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

export type Role = 'super_admin' | 'admin' | 'collaborator' | 'visitor';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 🔓 Endpoint sin roles → usuario autenticado pasa
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const internalUser = request.user?.internal;

    if (!internalUser) {
      throw new ForbiddenException('Internal user missing');
    }

    if (!requiredRoles.includes(internalUser.role)) {
      throw new ForbiddenException('Insufficient role');
    }

    return true;
  }
}
