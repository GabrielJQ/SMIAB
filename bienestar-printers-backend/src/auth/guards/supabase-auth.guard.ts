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
  implements CanActivate
{
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

    // 4️⃣ Crear usuario interno si no existe
    if (!internalUser) {
      internalUser = await this.usersService.createFromSupabase({
        supabaseUserId: supabaseUser.sub,
        email: supabaseUser.email,
      });
    }

    // 5️⃣ Validar estado de negocio
    if (internalUser.status !== 'active') {
      throw new ForbiddenException('User inactive');
    }

    // 6️⃣ Normalizar request.user (contrato FINAL de tu app)
    request.user = {
      supabase: supabaseUser,
      internal: internalUser,
      areaId: internalUser.area_id,
    };

    return true;
  }
}
