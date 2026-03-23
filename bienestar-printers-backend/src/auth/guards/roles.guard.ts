import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

export type Role = 'super_admin' | 'admin' | 'collaborator' | 'visitor';

/**
 * @class RolesGuard
 * @description Guardia encargado de validar si el usuario autenticado posee los privilegios (roles) necesarios
 * para acceder a un recurso específico.
 * 
 * @implements {CanActivate}
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  /**
   * @method canActivate
   * @description Determina si la petición actual cumple con los requisitos de rol definidos en el decorador @Roles.
   * @param {ExecutionContext} context - Contexto de ejecución de NestJS.
   * @returns {boolean} True si tiene acceso, de lo contrario lanza ForbiddenException.
   * @throws {ForbiddenException} Si el usuario no tiene rol o el rol es insuficiente.
   */
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
