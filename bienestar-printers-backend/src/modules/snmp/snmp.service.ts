import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Printer } from '../printers/entities/printer.entity';
import { PrinterMonthlyStat } from '../printers/entities/printer-monthly-stat.entity';
import { TelemetryProcessor } from './processors/telemetry.processor';
import { SnmpDriverFactory } from './drivers/snmp-driver.factory';
import { SYS_DESCR_OID, SNMP_DRIVERS_CONFIG } from './constants/oids.constants';
import * as snmp from 'net-snmp';
import pLimit from 'p-limit';

/**
 * Servicio encargado de la comunicación y recolección de datos vía SNMP (Simple Network Management Protocol).
 * Actúa como el "Recolector de Telemetría" del sistema SMIAB, gestionando barridos automáticos,
 * detección de cambios de tóner y cierre mensual de contadores.
 */
@Injectable()
export class SnmpService implements OnModuleInit {
  private readonly logger = new Logger(SnmpService.name);
  private readonly snmpMode: string;

  constructor(
    @InjectRepository(Printer)
    private readonly printerRepository: Repository<Printer>,
    @InjectRepository(PrinterMonthlyStat)
    private readonly printerMonthlyStatRepository: Repository<PrinterMonthlyStat>,
    private readonly telemetryProcessor: TelemetryProcessor,
    private readonly configService: ConfigService,
  ) {
    this.snmpMode = this.configService.get<string>('SNMP_MODE') || 'simulation';
    this.logger.log(`SNMP Service initialized in ${this.snmpMode} mode`);
  }

  onModuleInit() {
    this.logger.log('Arrancando primera lectura forzada al iniciar el servidor...');
    this.forcePrinterUpdate().catch((err) =>
      this.logger.error('Error in initial SNMP sweep', err),
    );
  }

  private isWorkingDay(mxTime: Date): boolean {
    const day = mxTime.getDay();
    if (day === 0 || day === 6) return false;

    const month = mxTime.getMonth() + 1;
    const dateDay = mxTime.getDate();

    if (month === 1 && dateDay === 1) return false;
    if (month === 5 && dateDay === 1) return false;
    if (month === 9 && dateDay === 16) return false;
    if (month === 12 && dateDay === 25) return false;
    if (month === 10 && dateDay === 1 && (mxTime.getFullYear() - 2024) % 6 === 0) return false;

    if (month === 2 && day === 1 && dateDay <= 7) return false;
    if (month === 3 && day === 1 && dateDay >= 15 && dateDay <= 21) return false;
    if (month === 11 && day === 1 && dateDay >= 15 && dateDay <= 21) return false;

    return true;
  }

  private isWorkingHours(date = new Date()): boolean {
    const mxTime = new Date(date.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
    if (!this.isWorkingDay(mxTime)) return false;
    const hour = mxTime.getHours();
    if (hour < 8 || hour >= 16) return false;
    return true;
  }

  @Cron('0 9 * * *', { timeZone: 'America/Mexico_City' })
  async scheduledSweep() {
    if (!this.isWorkingHours()) {
      this.logger.debug('Fuera de horario laboral. Omitiendo barrido SNMP.');
      return;
    }
    this.logger.log('Iniciando barrido automático de las 9:00 AM...');
    await this.executeSweep();
  }

  public async forcePrinterUpdate(assetId?: string) {
    this.logger.log(`Barrido manual solicitado. AssetID: ${assetId || 'TODAS'}`);
    return await this.executeSweep(assetId, false);
  }

  public async forceMonthlyClosing(assetId?: string) {
    this.logger.log(`Cierre mensual manual solicitado. AssetID: ${assetId || 'TODAS'}`);
    return await this.executeSweep(assetId, true);
  }

  private async executeSweep(assetId?: string, forceClosing: boolean = false) {
    const query = this.printerRepository.createQueryBuilder('printer').where('printer.ip_printer IS NOT NULL');
    if (assetId) query.andWhere('printer.asset_id = :assetId', { assetId });

    const printers = await query.getMany();
    if (printers.length === 0) return { success: false, message: 'No se encontraron impresoras válidas.' };

    const now = new Date();
    let successCount = 0;
    const limit = pLimit(20);

    const promises = printers.map((printer) =>
      limit(async () => {
        try {
          const success = this.snmpMode === 'simulation'
              ? await this.simulateRead(printer)
              : await this.productionRead(printer);
          
          if (success) {
            successCount++;
            if (forceClosing) await this.processMonthlyClosing(printer, now, forceClosing);
          }
        } catch (error) {
          this.logger.error(`Error no controlado en barrido para ${printer.ipPrinter || printer.assetId}:`, error);
        }
      })
    );

    await Promise.all(promises);
    this.logger.log(`Barrido finalizado. ${successCount}/${printers.length} impresoras actualizadas.`);
    return { success: true, updated: successCount, total: printers.length };
  }

  private async simulateRead(printer: Printer): Promise<boolean> {
    const randomToner = Math.floor(Math.random() * 101);
    const randomStatus = Math.random() > 0.1 ? 'online' : 'offline';
    
    const currentPages = parseInt(printer.totalPagesPrinted || '0', 10);
    const addedPages = Math.floor(Math.random() * 50);
    const newPages = currentPages + addedPages;

    printer.printerStatus = randomStatus;
    printer.tonerLvl = randomToner;
    printer.totalPagesPrinted = newPages.toString();
    printer.lastReadAt = new Date();
    printer.updatedAt = new Date();

    await this.printerRepository.save(printer);
    await this.telemetryProcessor.processTonerTelemetry(printer.assetId, randomToner);
    
    this.logger.debug(`Simulated read for printer ${printer.assetId} successful (Level: ${randomToner}%).`);
    return randomStatus === 'online';
  }

  @Cron('0 3 * * *', { timeZone: 'America/Mexico_City' })
  async cleanupOldData() {
    this.logger.log('Iniciando limpieza de mantenimiento (3:00 AM)...');
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    try {
      await this.telemetryProcessor.cleanupOldData(thirtyDaysAgo);
    } catch (error) {
      this.logger.error('Error durante mantenimiento:', error);
    }
  }

  private async productionRead(printer: Printer): Promise<boolean> {
    const ip = printer.ipPrinter.trim().replace(/\s+/g, '');
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      try {
        let sysDescr = 'generic';
        try {
          const sysResult = await this.readSnmpOids(ip, [SYS_DESCR_OID]);
          if (sysResult[0]) sysDescr = sysResult[0].toString().toLowerCase();
        } catch (e) {
          this.logger.debug(`Fallo al leer sysDescr en ${ip}, usando driver generic.`);
        }

        const driver = SnmpDriverFactory.getDriver(sysDescr);
        const config = SNMP_DRIVERS_CONFIG[driver.getBrand().toLowerCase()] || SNMP_DRIVERS_CONFIG.generic;
        const session = snmp.createSession(ip, 'public');
        
        try {
          const tonerLvl = await driver.getTonerLevel(session, config);
          const totalPages = await driver.getTotalPages(session, config);

          const previousTotal = parseInt(printer.totalPagesPrinted || '0', 10);
          const delta = totalPages > previousTotal ? totalPages - previousTotal : 0;
          
          printer.printerStatus = 'online';
          printer.totalPagesPrinted = totalPages.toString();
          printer.printOnlyPages = (parseInt(printer.printOnlyPages || '0', 10) + delta).toString();

          await this.telemetryProcessor.processTonerTelemetry(printer.assetId, tonerLvl, ip);
          
          printer.lastReadAt = new Date();
          printer.updatedAt = new Date();
          await this.printerRepository.save(printer);
          
          return true;
        } finally {
          session.close();
        }
      } catch (error) {
        retries++;
        if (retries >= maxRetries) {
          printer.printerStatus = 'offline';
          await this.printerRepository.save(printer);
          return false;
        }
        await new Promise(res => setTimeout(res, 2000));
      }
    }
    return false;
  }

  private readSnmpOids(ip: string, oids: string[]): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const session = snmp.createSession(ip, 'public', { retries: 1, timeout: 3000, version: snmp.Version2c });
      session.get(oids, (error, varbinds) => {
        session.close();
        if (error || !varbinds) reject(error || new Error('No varbinds'));
        else resolve(varbinds.map(vb => snmp.isVarbindError(vb) ? null : vb.value));
      });
    });
  }

  private async processMonthlyClosing(
    printer: Printer,
    date: Date = new Date(),
    forceUpdate: boolean = false
  ) {
    const mxTime = new Date(
      date.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }),
    );

    let targetYear = mxTime.getFullYear();
    let targetMonth = mxTime.getMonth() + 1; // 1-12

    // Lógica de Ventana: Si estamos en los primeros 5 días, el cierre es para el mes pasado
    if (mxTime.getDate() <= 5) {
      targetMonth -= 1;
      if (targetMonth === 0) {
        targetMonth = 12;
        targetYear -= 1;
      }
    }

    const currentYear = targetYear;
    const currentMonth = targetMonth;

    try {
      // Revisa si ya procesamos este mes (idempotencia)
      const existingStat = await this.printerMonthlyStatRepository.findOne({
        where: {
          assetId: printer.assetId,
          year: currentYear,
          month: currentMonth,
        },
      });

      if (existingStat && !forceUpdate) {
        return;
      }

      const currentTotal = parseInt(printer.totalPagesPrinted || '0', 10);
      const currentPrint = parseInt(printer.printOnlyPages || '0', 10);
      const currentCopy = parseInt(printer.copyPages || '0', 10);

      if (isNaN(currentTotal) || currentTotal <= 0) {
        return;
      }

      // Busca el ÚLTIMO registro cronológico para esta impresora (excluyendo el mes actual)
      const lastStat = await this.printerMonthlyStatRepository
        .createQueryBuilder('stat')
        .where('stat.assetId = :assetId', { assetId: printer.assetId })
        .andWhere(
          '(stat.year < :year OR (stat.year = :year AND stat.month < :month))',
          { year: currentYear, month: currentMonth },
        )
        .orderBy('stat.year', 'DESC')
        .addOrderBy('stat.month', 'DESC')
        .getOne();

      let lastTotal = 0;
      let lastPrint = 0;
      let lastCopy = 0;

      if (lastStat) {
        lastTotal = parseInt(lastStat.printTotalReading || '0', 10);
        lastPrint = parseInt(lastStat.printOnlyReading || '0', 10);
        lastCopy = parseInt(lastStat.copyReading || '0', 10);

        if (lastTotal === 0 && currentTotal > 0) {
          lastTotal = currentTotal;
          lastPrint = currentPrint;
          lastCopy = currentCopy;
        }
      } else {
        lastTotal = currentTotal;
        lastPrint = currentPrint;
        lastCopy = currentCopy;
      }

      let printTotalDelta = currentTotal - lastTotal;
      let printOnlyDelta = currentPrint - lastPrint;
      let copyDelta = currentCopy - lastCopy;

      if (lastTotal > 0 && lastPrint === 0 && lastCopy === 0) {
        if (currentTotal > 0) {
          const ratioP = currentPrint / currentTotal;
          printOnlyDelta = Math.floor(printTotalDelta * ratioP);
          copyDelta = printTotalDelta - printOnlyDelta;
        } else {
          printOnlyDelta = printTotalDelta;
          copyDelta = 0;
        }
      }

      if (printTotalDelta < 0) printTotalDelta = 0;
      if (printOnlyDelta < 0) printOnlyDelta = 0;
      if (copyDelta < 0) copyDelta = 0;

      const stat = existingStat || this.printerMonthlyStatRepository.create({
        assetId: printer.assetId,
        year: currentYear,
        month: currentMonth,
      });

      stat.printTotalDelta = printTotalDelta.toString();
      stat.printOnlyDelta = printOnlyDelta.toString();
      stat.copyDelta = copyDelta.toString();
      stat.printTotalReading = currentTotal.toString();
      stat.printOnlyReading = currentPrint.toString();
      stat.copyReading = currentCopy.toString();
      stat.updatedAt = new Date();

      await this.printerMonthlyStatRepository.save(stat);
      this.logger.debug(
        `Monthly stat saved for printer ${printer.assetId}. Total Delta: ${printTotalDelta}, Print: ${printOnlyDelta}, Copy: ${copyDelta}`,
      );
    } catch (err) {
      this.logger.error(
        `Error processing monthly closing for printer ${printer.assetId}`,
        err.stack,
      );
    }
  }
}
