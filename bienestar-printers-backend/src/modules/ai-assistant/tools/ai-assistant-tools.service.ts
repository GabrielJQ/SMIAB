import { Injectable, Logger } from '@nestjs/common';
import { PrintersService } from '../../printers/printers.service';
import { TonersService } from '../../toners/toners.service';

/**
 * @class AiAssistantToolsService
 * @description Provee las funciones de herramienta (tools) que el modelo de IA Gemini
 * puede invocar para obtener datos reales del sistema SMIAB.
 * Todas las consultas están protegidas por el `unitId` del usuario.
 */
@Injectable()
export class AiAssistantToolsService {
  private readonly logger = new Logger(AiAssistantToolsService.name);

  constructor(
    private readonly printersService: PrintersService,
    private readonly tonersService: TonersService,
  ) {}

  /**
   * @tool getOperationalStatus
   * @description Obtiene un resumen del estado operativo de las impresoras (Total, Online, Offline).
   */
  async getOperationalStatus(unitId: string) {
    this.logger.log(`Tool: getOperationalStatus called for unit ${unitId}`);
    return await this.printersService.getOperationalStatus(unitId);
  }

  /**
   * @tool getOfflinePrinters
   * @description Lista las impresoras que están desconectadas o no han reportado hoy.
   */
  async getOfflinePrinters(unitId: string) {
    this.logger.log(`Tool: getOfflinePrinters called for unit ${unitId}`);
    const printers = await this.printersService.getPrintersByUnit(unitId);
    
    // Filtrar por lógica de "offline" (igual que en el dashboard)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    return printers.filter(p => 
      !p.isOnline || 
      !p.lastSyncAt || 
      new Date(p.lastSyncAt) < startOfToday
    );
  }

  /**
   * @tool getTopConsumers
   * @description Identifica las impresoras que han tenido más cambios de tóner en el periodo actual.
   */
  async getTopConsumers(unitId: string, limit: number = 5) {
    this.logger.log(`Tool: getTopConsumers called for unit ${unitId}`);
    const today = new Date();
    const consumers = await this.tonersService.getUnitTopConsumers(unitId, {
      startYear: today.getFullYear(),
      startMonth: today.getMonth() + 1,
    });
    return consumers.slice(0, limit);
  }

  /**
   * @tool getRecentTonerChanges
   * @description Muestra los últimos cambios de tóner registrados en la unidad.
   */
  async getRecentTonerChanges(unitId: string) {
    this.logger.log(`Tool: getRecentTonerChanges called for unit ${unitId}`);
    return await this.tonersService.getRecentChangesByUnit(unitId);
  }

  /**
   * @tool getUnitPrinters
   * @description Lista todas las impresoras asignadas a la unidad del usuario.
   */
  async getUnitPrinters(unitId: string) {
    this.logger.log(`Tool: getUnitPrinters called for unit ${unitId}`);
    return await this.printersService.getPrintersByUnit(unitId);
  }

  /**
   * @tool getPrinterDetails
   * @description Obtiene detalles técnicos, niveles de tóner y estado de una impresora específica.
   */
  async getPrinterDetails(printerIdOrIp: string, unitId: string) {
    this.logger.log(`Tool: getPrinterDetails called for ${printerIdOrIp} in unit ${unitId}`);
    
    // Intentar buscar por ID primero, luego por IP
    let printer = await this.printersService.getPrinterById(printerIdOrIp, unitId).catch(() => null);
    
    if (!printer) {
      const allPrinters = await this.printersService.getPrintersByUnit(unitId);
      printer = allPrinters.find(p => p.ipAddress === printerIdOrIp || p.name === printerIdOrIp) || null;
    }

    return printer;
  }
}
