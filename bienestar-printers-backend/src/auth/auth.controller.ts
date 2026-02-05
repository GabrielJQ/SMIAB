import { Controller, Get, UseGuards } from '@nestjs/common';

import { SupabaseAuthGuard } from './guards/supabase-auth.guard';
import { StatusGuard } from './guards/status.guard';
import { CurrentUser } from './decorators/current-user.decorator';

import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import type { AuthenticatedUser } from './types/authenticated-user.type';

/*@Controller('auth')
export class AuthController {
  @UseGuards(SupabaseAuthGuard, StatusGuard, RolesGuard)
  @Roles('admin')
  @Get('me')
  me(@CurrentUser() user : AuthenticatedUser) {
    return user;

  } */

   @Controller('auth')
export class AuthController {
  @UseGuards(SupabaseAuthGuard, StatusGuard)
  @Get('me')
  me(@CurrentUser() user) {
    return user;
  } 
}


  




