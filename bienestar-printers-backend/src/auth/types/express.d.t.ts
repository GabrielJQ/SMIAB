import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';

/**
 * @namespace Express
 * @description Inyección de tipos globales (Declaration Merging) para el objeto Request de Express.
 * Asegura que TypeScript reconozca la propiedad 'user' fuertemente tipada como AuthenticatedUser
 * a lo largo de todos los controladores.
 */
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
