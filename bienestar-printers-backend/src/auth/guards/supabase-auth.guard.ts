import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from '../../modules/users/users.service';
import type { SupabaseUser } from '../types/supabase-user.type';

@Injectable()
export class SupabaseAuthGuard
  extends AuthGuard('supabase-jwt')
  implements CanActivate {
  constructor(private readonly usersService: UsersService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1️⃣ Dejar que Passport valide el JWT
    const activated = (await super.canActivate(context)) as boolean;
    if (!activated) {
      throw new UnauthorizedException();
    }

    const request = context.switchToHttp().getRequest();

    // 2️⃣ Payload crudo de Supabase (viene del strategy.validate)
    const supabaseUser = request.user as SupabaseUser;

    if (!supabaseUser?.sub) {
      throw new UnauthorizedException('Invalid Supabase token');
    }

    if (!supabaseUser.email) {
      throw new UnauthorizedException('Email is required');
    }

    // 3️⃣ Buscar usuario interno
    let internalUser =
      await this.usersService.findBySupabaseUserId(supabaseUser.sub);

    // 4️⃣ Ya no creamos usuarios nuevos porque este microservicio es dependiente de SAI.
    // Omitimos el bloque de createFromSupabase() para dejar que la siguiente validación capture el Null.

    // 5️⃣ Validar estado de negocio (Hard delete policy)
    // El sistema central SAI ahora usa hard deletes, por lo que si el usuario no existe o es null,
    // significa que ya no tiene acceso.
    if (!internalUser) {
      throw new UnauthorizedException('El usuario no existe en el sistema central SAI');
    }

    // 6️⃣ Normalizar request.user (contrato FINAL de tu app)
    request.user = {
      supabase: supabaseUser,
      internal: internalUser,
      areaId: internalUser.department_id || internalUser.unit_id,
      unitId: internalUser.unit_id,
      departmentId: internalUser.department_id,
      regionId: internalUser.region_id,
    };

    return true;
  }
}