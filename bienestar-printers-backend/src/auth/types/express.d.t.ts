import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
