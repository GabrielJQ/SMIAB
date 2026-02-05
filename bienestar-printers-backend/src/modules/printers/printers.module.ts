import { Module } from '@nestjs/common';
import { PrintersController } from './printers.controller';
import { PrintersService } from './printers.service';
import { UsersModule } from '../users/users.module';
import { SupabaseModule } from "../../integrations/supabase/supabase.module";
@Module({
  imports: [UsersModule, SupabaseModule],
  controllers: [PrintersController],
  providers: [PrintersService],
  exports: [PrintersService],
})
export class PrintersModule {}
