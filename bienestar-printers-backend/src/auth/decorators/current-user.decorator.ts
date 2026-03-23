import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedUser } from '../types/authenticated-user.type';

/**
 * @decorator CurrentUser
 * @description Decorador de parámetro para extraer el usuario autenticado del objeto Request.
 * Permite obtener el objeto de sesión completo o una propiedad específica (ej: 'internal').
 * 
 * Cuando se solicita la propiedad 'internal', el decorador normaliza los identificadores 
 * de ubicación (areaId, unitId, departmentId, regionId) para facilitar su uso en el resto del sistema.
 * 
 * @param {keyof AuthenticatedUser | undefined} key - Propiedad específica a extraer del usuario.
 * @param {ExecutionContext} ctx - Contexto de ejecución de NestJS.
 */
export const CurrentUser = createParamDecorator(
  (key: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;

    if (!user) return null;

    if (key === 'internal' && user.internal) {
      return {
        ...user.internal,
        areaId:
          user.internal.department_id?.toString() ||
          user.internal.unit_id?.toString(),
        unitId: user.internal.unit_id?.toString(),
        departmentId: user.internal.department_id?.toString(),
        regionId: user.internal.region_id?.toString(),
      };
    }

    return key ? user[key] : user;
  },
);
