/**
 * @interface UserJwtPayload
 * @description Mapea el contenido del contrato (Payload) que viaja encriptado dentro del token JWT de la aplicación.
 * Útil para firmas secundarias o validaciones aisladas del estado del rol y la zona asignada.
 */
export class UserJwtPayload {
  sub: string;
  email: string;
  role: string;
  areaId?: string; // Legacy
  unitId?: string;
  departmentId?: string;
  regionId?: string;
}
