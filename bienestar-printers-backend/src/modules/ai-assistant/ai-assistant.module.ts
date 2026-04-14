import { Module } from '@nestjs/common';
import { AiAssistantService } from './ai-assistant.service';
import { AiAssistantGateway } from './ai-assistant.gateway';
import { AiAssistantToolsService } from './tools/ai-assistant-tools.service';
import { PrintersModule } from '../printers/printers.module';
import { TonersModule } from '../toners/toners.module';
import { UsersModule } from '../users/users.module';

/**
 * @module AiAssistantModule
 * @description Centraliza la lógica de inteligencia artificial y comunicación en tiempo real.
 * Inyecta los servicios operativos de impresoras y tóners para dotar al asistente de datos reales.
 */
@Module({
  imports: [
    PrintersModule,
    TonersModule,
    UsersModule,
  ],
  providers: [
    AiAssistantService,
    AiAssistantGateway,
    AiAssistantToolsService,
  ],
  exports: [AiAssistantService],
})
export class AiAssistantModule {}
