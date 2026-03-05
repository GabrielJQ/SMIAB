import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './integrations/supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PrintersModule } from './modules/printers/printers.module';
import { TonersModule } from './modules/toners/toners.module';
import { SnmpModule } from './modules/snmp/snmp.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: false, // We use existing tables
      }),
    }),
    SupabaseModule,
    AuthModule,
    UsersModule,
    PrintersModule,
    TonersModule,
    SnmpModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

