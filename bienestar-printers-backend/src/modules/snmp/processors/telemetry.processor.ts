import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert } from '../../printers/entities/alert.entity';
import { PrinterStatusLog } from '../../printers/entities/printer-status-log.entity';
import { PrinterTonerChange } from '../../toners/entities/printer-toner-change.entity';
import { ReportsConsumablesService } from '../../reports/services/reports-consumables.service';

/**
 * @class TelemetryProcessor
 * @description Centraliza la lógica de negocio aplicada a los datos obtenidos vía SNMP.
 * Se encarga de la persistencia de logs, generación de alertas y detección de cambios de tóner.
 */
@Injectable()
export class TelemetryProcessor {
  private readonly logger = new Logger(TelemetryProcessor.name);

  constructor(
    @InjectRepository(Alert)
    private readonly alertRepository: Repository<Alert>,
    @InjectRepository(PrinterStatusLog)
    private readonly printerStatusLogRepository: Repository<PrinterStatusLog>,
    @InjectRepository(PrinterTonerChange)
    private readonly tonerChangeRepository: Repository<PrinterTonerChange>,
    private readonly reportService: ReportsConsumablesService,
  ) {}

  /**
   * @method processTonerTelemetry
   * @description Analiza el nivel de tóner, guarda logs diarios y dispara alertas de nivel crítico.
   */
  async processTonerTelemetry(printerId: string, tonerLvl: number | null, printerIp?: string) {
    if (tonerLvl == null) return;

    try {
      // 1. Registro de Log Diario (Optimizado)
      const lastLog = await this.printerStatusLogRepository.findOne({
        where: { printerId },
        order: { recordedAt: 'DESC' },
      });

      const now = new Date();
      const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
      let shouldSave = true;

      if (lastLog) {
        const lastLogDateStr = lastLog.recordedAt.toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
        if (lastLogDateStr === todayStr) {
          shouldSave = false;
        }
      }

      if (shouldSave) {
        const log = this.printerStatusLogRepository.create({
          printerId,
          tonerLevel: tonerLvl,
        });
        await this.printerStatusLogRepository.save(log);
      }

      const oldToner = lastLog ? lastLog.tonerLevel : 0;
      
      // 2. Lógica de Alertas por Cambio de Tóner (Comparativa)
      if (lastLog && tonerLvl > oldToner) {
        if (oldToner <= 5 && tonerLvl >= 98) {
          await this.registerTonerChange(printerId, 'auto_detected');
        } else if (tonerLvl >= 98 && oldToner > 5) {
          await this.registerPrematureChange(printerId, oldToner, tonerLvl);
          await this.registerTonerChange(printerId, 'auto_detected');
        } else if (tonerLvl < 98) {
          await this.registerSuspiciousSwap(printerId, oldToner, tonerLvl);
        }
      } else if (lastLog && oldToner - tonerLvl > 10 && tonerLvl !== 0) {
        // Intercambio por cartucho usado/vacío (Swap negativo grave)
        await this.registerSuspiciousSwap(printerId, oldToner, tonerLvl);
      }

      // 3. Gestión de Alertas de Nivel Crítico (33%)
      if (tonerLvl <= 33) {
        const activeAlert = await this.alertRepository.findOne({
          where: { printerId, status: 'PENDING', type: 'TONER_LOW' },
        });

        if (!activeAlert) {
          const alert = this.alertRepository.create({
            printerId,
            type: 'TONER_LOW',
            status: 'PENDING',
            metadata: {
              level: tonerLvl,
              at: new Date(),
            },
          });
          await this.alertRepository.save(alert);
        }

        // --- AUTOMATIZACIÓN DE CORREO (Heredada de feature/automatizacion-correos) ---
        const alertToNotify = await this.alertRepository.findOne({
          where: { printerId, status: 'PENDING', type: 'TONER_LOW' },
          relations: [
            'printer', 
            'printer.asset', 
            'printer.asset.currentAssignment', 
            'printer.asset.currentAssignment.employee'
          ],
        });

        if (alertToNotify && !alertToNotify.metadata?.emailSent) {
          // Obtener el correo del resguardante o usar uno de respaldo/admin
          const recipientEmail = alertToNotify.printer?.asset?.currentAssignment?.employee?.email || 'soporte.smiab@bienestar.gob.mx';

          this.logger.log(`Disparando correo automático de consumibles para ${printerId} a ${recipientEmail}`);
          
          try {
            await this.reportService.sendConsumableRequest(printerId, printerIp || alertToNotify.printer?.ipPrinter, recipientEmail);
            
            // Protección contra metadata null y actualización segura
            const currentMetadata = alertToNotify.metadata || {};
            alertToNotify.metadata = {
              ...currentMetadata,
              emailSent: true,
              notifiedAt: new Date(),
            };
            await this.alertRepository.save(alertToNotify);
          } catch (mailError) {
            this.logger.error(`Error al enviar correo automático para ${printerId}:`, mailError);
          }
        }
      }
    } catch (e) {
      this.logger.error(`Error processing toner telemetry for ${printerId}: ${e.message}`);
    }
  }

  async registerPrematureChange(printerId: string, oldLevel: number, newLevel: number) {
    const activeAlert = await this.alertRepository.findOne({
      where: { printerId, status: 'PENDING', type: 'PREMATURE_CHANGE' },
    });
    if (!activeAlert) {
      const alert = this.alertRepository.create({
        printerId,
        type: 'PREMATURE_CHANGE',
        status: 'PENDING',
        metadata: { oldLevel, newLevel, difference: newLevel - oldLevel, at: new Date() },
      });
      await this.alertRepository.save(alert);
      this.logger.warn(`Alerta registrada PREMATURE_CHANGE para ${printerId}. Viejo: ${oldLevel}%, Nuevo: ${newLevel}%`);
    }
  }

  async registerSuspiciousSwap(printerId: string, oldLevel: number, newLevel: number) {
    const activeAlert = await this.alertRepository.findOne({
      where: { printerId, status: 'PENDING', type: 'SUSPICIOUS_SWAP' },
    });
    if (!activeAlert) {
      const alert = this.alertRepository.create({
        printerId,
        type: 'SUSPICIOUS_SWAP',
        status: 'PENDING',
        metadata: { oldLevel, newLevel, difference: newLevel - oldLevel, at: new Date() },
      });
      await this.alertRepository.save(alert);
      this.logger.warn(`Alerta registrada SUSPICIOUS_SWAP para ${printerId}. Viejo: ${oldLevel}%, Nuevo: ${newLevel}%`);
    }
  }

  async registerTonerChange(assetId: string, detectionType: 'auto_detected' | 'manual' = 'auto_detected') {
    const change = this.tonerChangeRepository.create({
      assetId,
      changedAt: new Date(),
      detectionType,
    });
    await this.tonerChangeRepository.save(change);
    this.logger.log(`Toner change registered for printer ${assetId} (Type: ${detectionType})`);
  }

  /**
   * @method cleanupOldData
   * @description Elimina logs de telemetría con más de 30 días de antigüedad para mantener la salud de la DB.
   */
  async cleanupOldData() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    this.logger.log(`Iniciando purga de telemetría anterior a ${thirtyDaysAgo.toISOString()}`);

    try {
      const result = await this.printerStatusLogRepository
        .createQueryBuilder()
        .delete()
        .where('recordedAt < :date', { date: thirtyDaysAgo })
        .execute();

      this.logger.log(`Purga completada. Registros eliminados: ${result.affected || 0}`);
    } catch (e) {
      this.logger.error(`Error eliminando registros antiguos: ${e.message}`);
    }
  }
  }
}
