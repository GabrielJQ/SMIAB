import { SetMetadata } from '@nestjs/common';
import { Role } from '../guards/roles.guard';

/**
 * @decorator Roles
 * @description Define los roles permitidos para acceder a un método o controlador.
 * Utilizado en conjunto con RolesGuard para restringir el acceso a usuarios con privilegios específicos.
 * 
 * @param {...Role[]} roles - Lista de roles autorizados (ej: 'super_admin', 'admin').
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
