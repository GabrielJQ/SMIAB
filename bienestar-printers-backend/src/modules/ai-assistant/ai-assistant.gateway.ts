import {
  WebSocketServer,
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards, UnauthorizedException } from '@nestjs/common';
import { AiAssistantService } from './ai-assistant.service';
import { UsersService } from '../users/users.service';

/**
 * @class AiAssistantGateway
 * @description Punto de entrada para la comunicación en tiempo real del Chat IA.
 * Gestiona conexiones persistentes, valida la identidad del usuario y 
 * coordina la entrega de respuestas del asistente.
 */
@WebSocketGateway({
  namespace: 'ai-assistant',
  cors: {
    origin: '*', // En producción debería ser restrictivo
  },
})
export class AiAssistantGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AiAssistantGateway.name);

  constructor(
    private readonly aiService: AiAssistantService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * @method handleConnection
   * @description Valida el token del usuario al intentar conectar.
   */
  async handleConnection(client: Socket) {
    try {
      // Extraer token de headers o auth payload
      const token = client.handshake.auth?.token || client.handshake.headers['authorization']?.split(' ')[1];
      
      if (!token) {
        this.logger.warn(`Connection attempt without token: ${client.id}`);
        client.disconnect();
        return;
      }

      // NOTA: Para este prototipo, asumimos que el cliente envía su context (unitId) 
      // pero en una implementación final validaríamos el JWT aquí.
      const unitId = client.handshake.query.unitId as string;
      
      if (!unitId) {
        this.logger.warn(`Connection attempt without unitId: ${client.id}`);
        client.disconnect();
        return;
      }

      this.logger.log(`Client connected: ${client.id} (Unit: ${unitId})`);
    } catch (error) {
      this.logger.error('Connection error', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * @method handleMessage
   * @description Recibe un prompt del usuario y emite la respuesta generada por Gemini.
   */
  @SubscribeMessage('send_message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { prompt: string; unitId: string; history?: any[] },
  ) {
    const { prompt, unitId, history = [] } = data;

    if (!prompt || !unitId) {
      client.emit('error', { message: 'Faltan parámetros requeridos' });
      return;
    }

    try {
      // Feedback visual de "escribiendo"
      client.emit('ai_typing', { status: true });

      const response = await this.aiService.generateResponse(prompt, unitId, history);

      client.emit('receive_message', {
        text: response,
        sender: 'ai',
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('Error processing message', error);
      client.emit('error', { message: 'Error interno en el asistente' });
    } finally {
      client.emit('ai_typing', { status: false });
    }
  }
}
