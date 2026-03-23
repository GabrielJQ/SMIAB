import { Controller, Get, UseGuards } from '@nestjs/common';

import { SupabaseAuthGuard } from './guards/supabase-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import type { AuthenticatedUser } from './types/authenticated-user.type';

/**
 * @class AuthController
 * @description Controlador encargado de gestionar las peticiones relacionadas con la identidad y sesión del usuario.
 */
@Controller('auth')
export class AuthController {
  /**
   * @method me
   * @description Recupera la información del usuario actualmente autenticado, incluyendo datos de Supabase e internos de SAI.
   * @param {any} user - Usuario extraído del token por el decorador @CurrentUser.
   * @returns {any} Objeto con la identidad completa del usuario.
   */
  @UseGuards(SupabaseAuthGuard)
  @Get('me')
  me(@CurrentUser() user) {
    return user;
  }
}
