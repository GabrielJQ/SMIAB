import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, Part, SchemaType } from '@google/generative-ai';
import { AiAssistantToolsService } from './tools/ai-assistant-tools.service';

/**
 * @class AiAssistantService
 * @description Orquestador de la inteligencia artificial. Maneja la sesión de Gemini,
 * define el sistema de instrucciones y procesa el Tool Calling para responder
 * preguntas basadas en datos reales del sistema.
 */
@Injectable()
export class AiAssistantService {
  private readonly logger = new Logger(AiAssistantService.name);
  private genAI: GoogleGenerativeAI;
  private readonly modelName = 'gemini-2.5-flash';

  constructor(
    private readonly configService: ConfigService,
    private readonly toolsService: AiAssistantToolsService,
  ) {
    const apiKey = this.configService.get<string>('GOOGLE_API_KEY') || '';
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * @method generateResponse
   * @description Procesa un mensaje del usuario, invoca herramientas si es necesario y retorna la respuesta final.
   * 
   * @param {string} prompt - Pregunta del usuario.
   * @param {string} unitId - ID de la unidad (para seguridad).
   * @param {any[]} history - Historial de la conversación.
   */
  async generateResponse(prompt: string, unitId: string, history: any[] = []) {
    try {
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        systemInstruction: `Eres SMIAB AI, un asistente experto en la gestión de impresoras para el sistema SMIAB.
        Tu objetivo es ayudar a los encargados de soporte técnico a monitorear sus equipos.
        
        REGLAS CRÍTICAS:
        1. Solo tienes acceso a los datos de la unidad del usuario (Unit ID: ${unitId}).
        2. Siempre usa las herramientas disponibles para dar respuestas basadas en hechos.
        3. Si una impresora está "offline", es porque no ha reportado hoy o su estado es explícitamente offline.
        4. Sé profesional, conciso y directo. Usa tablas en Markdown para mostrar listas de impresoras o consumos.
        5. No inventes datos. Si no encuentras una impresora, informa amablemente.`,
        tools: [
          {
            functionDeclarations: [
              {
                name: 'getOperationalStatus',
                description: 'Obtiene el resumen de cuántas impresoras están online, offline y el total.',
              },
              {
                name: 'getOfflinePrinters',
                description: 'Lista detallada de las impresoras que están desconectadas.',
              },
              {
                name: 'getTopConsumers',
                description: 'Ranking de impresoras con mayor consumo de tóner en el mes.',
                parameters: {
                  type: SchemaType.OBJECT,
                  properties: {
                    limit: { type: SchemaType.NUMBER, description: 'Cantidad de equipos a mostrar' }
                  }
                }
              },
              {
                name: 'getRecentTonerChanges',
                description: 'Lista de los últimos cambios de tóner realizados en la unidad.',
              },
              {
                name: 'getUnitPrinters',
                description: 'Lista básica de todas las impresoras en la unidad.',
              },
              {
                name: 'getPrinterDetails',
                description: 'Obtiene información técnica completa de una impresora específica.',
                parameters: {
                  type: SchemaType.OBJECT,
                  properties: {
                    printerIdOrIp: { type: SchemaType.STRING, description: 'ID o IP de la impresora' }
                  },
                  required: ['printerIdOrIp']
                }
              }
            ]
          }
        ]
      });

      // Validar que el historial comience con un mensaje del usuario (requisito de Gemini)
      const validHistory: any[] = [];
      let foundFirstUser = false;
      for (const entry of history) {
        if (entry.role === 'user') foundFirstUser = true;
        if (foundFirstUser) validHistory.push(entry);
      }

      const chat = model.startChat({ history: validHistory });

      // Enviar el prompt
      const result = await chat.sendMessage(prompt);
      const response = result.response;
      const functionCalls = response.functionCalls();

      if (functionCalls) {
        const toolResponses: Part[] = [];

        for (const call of functionCalls) {
          const { name, args } = call;
          let toolResult;

          // Ejecución dinámica de herramientas
          switch (name) {
            case 'getOperationalStatus':
              toolResult = await this.toolsService.getOperationalStatus(unitId);
              break;
            case 'getOfflinePrinters':
              toolResult = await this.toolsService.getOfflinePrinters(unitId);
              break;
            case 'getTopConsumers':
              toolResult = await this.toolsService.getTopConsumers(unitId, (args as any).limit);
              break;
            case 'getRecentTonerChanges':
              toolResult = await this.toolsService.getRecentTonerChanges(unitId);
              break;
            case 'getUnitPrinters':
              toolResult = await this.toolsService.getUnitPrinters(unitId);
              break;
            case 'getPrinterDetails':
              toolResult = await this.toolsService.getPrinterDetails((args as any).printerIdOrIp, unitId);
              break;
            default:
              toolResult = { error: 'Tool not found' };
          }

          toolResponses.push({
            functionResponse: {
              name,
              response: { result: toolResult }
            }
          });
        }

        // Enviar resultados de vuelta a Gemini para la respuesta final
        const finalResult = await chat.sendMessage(toolResponses);
        return finalResult.response.text();
      }

      return response.text();
    } catch (error) {
      this.logger.error('Error in AiAssistantService:', error);
      return 'Lo siento, ocurrió un problema al procesar tu solicitud. Por favor intenta de nuevo.';
    }
  }
}
