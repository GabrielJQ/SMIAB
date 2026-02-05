import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './auth.controller';
import { SupabaseJwtStrategy } from './strategies/supabase-jwt.strategy';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { UsersModule } from '../modules/users/users.module'; 

@Module({
  imports: [
    PassportModule.register({
      defaultStrategy: 'supabase-jwt',
    }),
    UsersModule, 
  ],
  controllers: [AuthController],
  providers: [
    SupabaseJwtStrategy,
    SupabaseAuthGuard,
    RolesGuard,
  ],
  exports: [
    SupabaseAuthGuard,
    RolesGuard,
  ],
})
export class AuthModule {}



