import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './integrations/supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PrintersModule } from './modules/printers/printers.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
        SupabaseModule,
        AuthModule,
        UsersModule,
        PrintersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

