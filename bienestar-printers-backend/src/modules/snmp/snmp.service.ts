import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Printer } from '../printers/entities/printer.entity';
import { PrinterMonthlyStat } from '../printers/entities/printer-monthly-stat.entity';
import { Alert } from '../printers/entities/alert.entity';
import { PrinterStatusLog } from '../printers/entities/printer-status-log.entity';
import { PrinterTonerChange } from '../toners/entities/printer-toner-change.entity';
import * as snmp from 'net-snmp';

type SnmpDriver = {
  totalPages: string;
  printOnly: string | null;
  copyOnly: string | null;
  tonerLevel: string;
  tonerMaxCapacity: string | null;
  maintenanceKit: string | null;
  maintenanceKitMax: string | null;
  imageUnit: string | null;
  imageUnitMax: string | null;
};

const SNMP_DRIVERS: Record<string, SnmpDriver> = {
  kyocera: {
    totalPages: '1.3.6.1.2.1.43.10.2.1.4.1.1',
    printOnly: '1.3.6.1.4.1.1347.43.10.1.1.12.1.1',
    copyOnly: '1.3.6.1.4.1.1347.43.10.1.1.12.1.2',
    tonerLevel: '1.3.6.1.2.1.43.11.1.1.9.1.1',
    tonerMaxCapacity: '1.3.6.1.2.1.43.11.1.1.8.1.1',
    maintenanceKit: '1.3.6.1.2.1.43.11.1.1.9.1.2',
    maintenanceKitMax: '1.3.6.1.2.1.43.11.1.1.8.1.2',
    imageUnit: '1.3.6.1.2.1.43.11.1.1.9.1.3',
    imageUnitMax: '1.3.6.1.2.1.43.11.1.1.8.1.3',
  },
  lexmark: {
    totalPages: '1.3.6.1.2.1.43.10.2.1.4.1.1',
    printOnly: null,
    copyOnly: null,
    tonerLevel: '1.3.6.1.2.1.43.11.1.1.9.1.3',
    tonerMaxCapacity: '1.3.6.1.2.1.43.11.1.1.8.1.3',
    maintenanceKit: '1.3.6.1.2.1.43.11.1.1.9.1.4',
    maintenanceKitMax: '1.3.6.1.2.1.43.11.1.1.8.1.4',
    imageUnit: '1.3.6.1.2.1.43.11.1.1.9.1.2',
    imageUnitMax: '1.3.6.1.2.1.43.11.1.1.8.1.2',
  },
  generic: {
    totalPages: '1.3.6.1.2.1.43.10.2.1.4.1.1',
    printOnly: null,
    copyOnly: null,
    tonerLevel: '1.3.6.1.2.1.43.11.1.1.9.1.1',
    tonerMaxCapacity: '1.3.6.1.2.1.43.11.1.1.8.1.1',
    maintenanceKit: '1.3.6.1.2.1.43.11.1.1.9.1.2',
    maintenanceKitMax: '1.3.6.1.2.1.43.11.1.1.8.1.2',
    imageUnit: '1.3.6.1.2.1.43.11.1.1.9.1.3',
    imageUnitMax: '1.3.6.1.2.1.43.11.1.1.8.1.3',
  },
};

const SYS_DESCR_OID = '1.3.6.1.2.1.1.1.0';

@Injectable()
export class SnmpService implements OnModuleInit {
  private readonly logger = new Logger(SnmpService.name);
  private readonly snmpMode: string;

  constructor(
    @InjectRepository(Printer)
    private readonly printerRepository: Repository<Printer>,
    @InjectRepository(PrinterMonthlyStat)
    private readonly printerMonthlyStatRepository: Repository<PrinterMonthlyStat>,
    @InjectRepository(Alert)
    private readonly alertRepository: Repository<Alert>,
    @InjectRepository(PrinterStatusLog)
    private readonly printerStatusLogRepository: Repository<PrinterStatusLog>,
    @InjectRepository(PrinterTonerChange)
    private readonly tonerChangeRepository: Repository<PrinterTonerChange>,
    private readonly configService: ConfigService,
  ) {
    this.snmpMode = this.configService.get<string>('SNMP_MODE') || 'simulation';
    this.logger.log(`SNMP Service initialized in ${this.snmpMode} mode`);
  }

  onModuleInit() {
    this.logger.log(
      'Arrancando primera lectura forzada al iniciar el servidor...',
    );
    // Execute background sweep on startup
    this.forcePrinterUpdate().catch((err) =>
      this.logger.error('Error in initial SNMP sweep', err),
    );
  }

  private isWorkingDay(mxTime: Date): boolean {
    const day = mxTime.getDay();
    // 0 = Sunday, 6 = Saturday
    if (day === 0 || day === 6) {
      return false;
    }

    const month = mxTime.getMonth() + 1; // 1-12
    const dateDay = mxTime.getDate();

    // Fixed holidays
    if (month === 1 && dateDay === 1) return false; // Año Nuevo
    if (month === 5 && dateDay === 1) return false; // Día del Trabajo
    if (month === 9 && dateDay === 16) return false; // Independencia
    if (month === 12 && dateDay === 25) return false; // Navidad
    // Presidential transition (Oct 1 every 6 years starting 2024)
    if (
      month === 10 &&
      dateDay === 1 &&
      (mxTime.getFullYear() - 2024) % 6 === 0
    )
      return false;

    // Floating holidays
    // First Monday of February
    if (month === 2 && day === 1 && dateDay <= 7) return false;
    // Third Monday of March
    if (month === 3 && day === 1 && dateDay >= 15 && dateDay <= 21)
      return false;
    // Third Monday of November
    if (month === 11 && day === 1 && dateDay >= 15 && dateDay <= 21)
      return false;

    return true;
  }

  private isWorkingHours(date = new Date()): boolean {
    const mxTime = new Date(
      date.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }),
    );

    if (!this.isWorkingDay(mxTime)) {
      return false;
    }

    const hour = mxTime.getHours();
    // 08:00 to 15:59
    if (hour < 8 || hour >= 16) {
      return false;
    }

    return true;
  }

  private isLastWorkingDayOfMonth(date = new Date()): boolean {
    const mxTime = new Date(
      date.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }),
    );

    if (!this.isWorkingDay(mxTime)) {
      return false;
    }

    const year = mxTime.getFullYear();
    const month = mxTime.getMonth(); // 0-11
    const currentDay = mxTime.getDate();

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let nextDay = currentDay + 1; nextDay <= daysInMonth; nextDay++) {
      const tempDate = new Date(year, month, nextDay);
      if (this.isWorkingDay(tempDate)) {
        return false;
      }
    }

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
    this.logger.log(
      `Barrido manual solicitado. AssetID: ${assetId || 'TODAS'}`,
    );
    return await this.executeSweep(assetId);
  }

  private async executeSweep(assetId?: string) {
    const query = this.printerRepository
      .createQueryBuilder('printer')
      .where('printer.ip_printer IS NOT NULL');

    if (assetId) {
      query.andWhere('printer.asset_id = :assetId', { assetId });
    }

    const printers = await query.getMany();
    if (printers.length === 0)
      return {
        success: false,
        message: 'No se encontraron impresoras válidas.',
      };

    const now = new Date();
    const isClosingDay = this.isLastWorkingDayOfMonth(now);
    let successCount = 0;

    for (const printer of printers) {
      const success =
        this.snmpMode === 'simulation'
          ? await this.simulateRead(printer)
          : await this.productionRead(printer);
      if (success) {
        successCount++;
        if (isClosingDay) await this.processMonthlyClosing(printer, now);
      }
    }
    this.logger.log(
      `Barrido finalizado. ${successCount}/${printers.length} impresoras actualizadas.`,
    );
    return { success: true, updated: successCount, total: printers.length };
  }

  private async simulateRead(printer: Printer): Promise<boolean> {
    // Generate random values
    const statusValues = ['online', 'offline'];
    const randomStatus =
      statusValues[Math.floor(Math.random() * statusValues.length)];
    const randomToner = Math.floor(Math.random() * 101); // 0-100
    const randomKit = Math.floor(Math.random() * 101); // 0-100
    const randomImg = Math.floor(Math.random() * 101); // 0-100

    // Increment copy/print/total slightly
    const currentPages = parseInt(printer.totalPagesPrinted || '0', 10);
    const currentPrintPages = parseInt(printer.printOnlyPages || '0', 10);
    const currentCopyPages = parseInt(printer.copyPages || '0', 10);

    const addedPrints = Math.floor(Math.random() * 70);
    const addedCopies = Math.floor(Math.random() * 30);
    const addedPages = addedPrints + addedCopies;

    const newPages = currentPages + addedPages;
    const newPrints = currentPrintPages + addedPrints;
    const newCopies = currentCopyPages + addedCopies;

    const oldToner = printer.tonerLvl;
    printer.printerStatus = randomStatus;
    printer.tonerLvl = randomToner;
    printer.kitMttnceLvl = randomKit;
    printer.uniImgLvl = randomImg;
    printer.totalPagesPrinted = newPages.toString();
    printer.printOnlyPages = newPrints.toString();
    printer.copyPages = newCopies.toString();
    printer.printerStatus = randomStatus;
    printer.lastReadAt = new Date();
    printer.updatedAt = new Date();

    if (oldToner <= 5 && randomToner >= 98) {
      // Cambio NORMAL (estricto < 5%)
      await this.registerTonerChange(printer.assetId, 'auto_detected');
    } else if (randomToner >= 98 && oldToner > 5) {
      // Cambio prematuro (Guardián)
      await this.registerPrematureChange(printer.assetId, oldToner, randomToner);
      await this.registerTonerChange(printer.assetId, 'auto_detected');
    } else if (oldToner - randomToner > 10 && randomToner !== 0) {
      // Caída drástica (Swap)
      await this.registerSuspiciousSwap(printer.assetId, oldToner, randomToner);
    } else if (randomToner > oldToner && randomToner < 98) {
      // Relleno parcial (Tóner usado)
      await this.registerSuspiciousSwap(printer.assetId, oldToner, randomToner);
    }

    await this.printerRepository.save(printer);
    await this.processTonerTelemetry(printer.assetId, randomToner);
    this.logger.debug(
      `Simulated read for printer ${printer.assetId} (IP: ${printer.ipPrinter}). Status: ${randomStatus}`,
    );
    return randomStatus === 'online';
  }

  private async productionRead(printer: Printer): Promise<boolean> {
    const ip = printer.ipPrinter.trim().replace(/\s+/g, '');
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      try {
        // 1. Detección de marca usando sysDescr
        let brandKey = 'generic';
        try {
          const sysResult = await this.readSnmpOids(ip, [SYS_DESCR_OID]);
          if (sysResult[0]) {
            let sysDescrString = '';
            if (Buffer.isBuffer(sysResult[0])) {
              sysDescrString = sysResult[0].toString('utf8').toLowerCase();
            } else if (typeof sysResult[0] === 'string') {
              sysDescrString = sysResult[0].toLowerCase();
            }

            if (sysDescrString.includes('lexmark')) {
              brandKey = 'lexmark';
            } else if (sysDescrString.includes('kyocera')) {
              brandKey = 'kyocera';
            }
          }
        } catch (e) {
          this.logger.debug(
            `Fallo al leer sysDescr en ${ip}, usando driver generic.`,
          );
        }

        const driver = { ...SNMP_DRIVERS[brandKey] };

        // --- DYNAMIC DISCOVERY FOR LEXMARK ---
        if (brandKey === 'lexmark') {
          try {
            const discoveryOids = [
              '1.3.6.1.2.1.43.11.1.1.6.1.1',
              '1.3.6.1.2.1.43.11.1.1.6.1.2',
              '1.3.6.1.2.1.43.11.1.1.6.1.3',
              '1.3.6.1.2.1.43.11.1.1.6.1.4',
              '1.3.6.1.2.1.43.11.1.1.6.1.5',
            ];
            const descriptions = await this.readSnmpOids(ip, discoveryOids);

            const normalize = (str: string) =>
              str
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase();

            descriptions.forEach((desc, i) => {
              if (!desc) return;
              const d = normalize(desc.toString());
              const idx = i + 1;

              if (
                d.includes('cartridge') ||
                d.includes('toner') ||
                d.includes('cartucho') ||
                d.includes('negro') ||
                d.includes('black') ||
                d.includes('ner')
              ) {
                driver.tonerLevel = `1.3.6.1.2.1.43.11.1.1.9.1.${idx}`;
                driver.tonerMaxCapacity = `1.3.6.1.2.1.43.11.1.1.8.1.${idx}`;
              } else if (
                d.includes('imaging') ||
                d.includes('image') ||
                d.includes('imagen') ||
                d.includes('fotoconductor') ||
                d.includes('unidad imagen')
              ) {
                driver.imageUnit = `1.3.6.1.2.1.43.11.1.1.9.1.${idx}`;
                driver.imageUnitMax = `1.3.6.1.2.1.43.11.1.1.8.1.${idx}`;
              } else if (
                d.includes('maintenance') ||
                d.includes('mantenimiento') ||
                d.includes('mantenimient')
              ) {
                driver.maintenanceKit = `1.3.6.1.2.1.43.11.1.1.9.1.${idx}`;
                driver.maintenanceKitMax = `1.3.6.1.2.1.43.11.1.1.8.1.${idx}`;
              }
            });
            this.logger.debug(`Dynamic discovery for Lexmark ${ip} complete.`);
          } catch (e) {
            this.logger.error(`Discovery failed for ${ip}: ${e.message}`);
          }
        }

        // 2. Construir lista dinámica de OIDs según el driver (puede estar modificado dinámicamente)
        const oidsToRequest: string[] = [];
        const oidMap: Record<string, number> = {};

        let idx = 0;
        oidsToRequest.push(driver.totalPages);
        oidMap['totalPages'] = idx++;

        if (driver.printOnly) {
          oidsToRequest.push(driver.printOnly);
          oidMap['printOnly'] = idx++;
        }

        if (driver.copyOnly) {
          oidsToRequest.push(driver.copyOnly);
          oidMap['copyOnly'] = idx++;
        }

        oidsToRequest.push(driver.tonerLevel);
        oidMap['tonerLevel'] = idx++;

        if (driver.tonerMaxCapacity) {
          oidsToRequest.push(driver.tonerMaxCapacity);
          oidMap['tonerMaxCapacity'] = idx++;
        }

        if (driver.maintenanceKit) {
          oidsToRequest.push(driver.maintenanceKit);
          oidMap['maintenanceKit'] = idx++;
          if (driver.maintenanceKitMax) {
            oidsToRequest.push(driver.maintenanceKitMax);
            oidMap['maintenanceKitMax'] = idx++;
          }
        }

        if (driver.imageUnit) {
          oidsToRequest.push(driver.imageUnit);
          oidMap['imageUnit'] = idx++;
          if (driver.imageUnitMax) {
            oidsToRequest.push(driver.imageUnitMax);
            oidMap['imageUnitMax'] = idx++;
          }
        }

        // 3. Ejecutar lectura con el array filtrado
        const result = await this.readSnmpOids(ip, oidsToRequest);

        // 4. Mapear respuestas
        const resTotalPages = result[oidMap['totalPages']];
        const resPrintOnly = driver.printOnly
          ? result[oidMap['printOnly']]
          : resTotalPages;
        const resCopyOnly = driver.copyOnly ? result[oidMap['copyOnly']] : 0;

        const resTonerLevel = result[oidMap['tonerLevel']];
        const resTonerMax = driver.tonerMaxCapacity
          ? result[oidMap['tonerMaxCapacity']]
          : null;
        const resKit = driver.maintenanceKit
          ? result[oidMap['maintenanceKit']]
          : null;
        const resKitMax = driver.maintenanceKitMax
          ? result[oidMap['maintenanceKitMax']]
          : null;
        const resImg = driver.imageUnit ? result[oidMap['imageUnit']] : null;
        const resImgMax = driver.imageUnitMax
          ? result[oidMap['imageUnitMax']]
          : null;

        // 5. Normalizar porcentajes
        const calculatePerc = (level: any, max: any): number | null => {
          if (typeof level !== 'number') return null;

          // Manejo de valores especiales/negativos en SNMP (Lexmark suele usar -3 para "Bajo")
          if (level < 0) return 1;

          if (max && typeof max === 'number' && max > 0) {
            let p = Math.floor((level / max) * 100);
            if (p < 0) p = 1;
            if (p > 100) p = 100;
            return p;
          } else {
            let p = level;
            // Si el valor es muy alto (ej: contador), no es un porcentaje
            if (p > 100) return null;
            if (p < 0) p = 1;
            return p;
          }
        };

        const customTonerPerc = calculatePerc(resTonerLevel, resTonerMax) ?? 0;

        // 6. Asignar al modelo
        printer.printerStatus = 'online';
        printer.totalPagesPrinted =
          resTotalPages?.toString() || printer.totalPagesPrinted;
        printer.printOnlyPages =
          resPrintOnly?.toString() ||
          printer.printOnlyPages ||
          printer.totalPagesPrinted;
        printer.copyPages = resCopyOnly?.toString() || printer.copyPages || '0';

        const oldToner = printer.tonerLvl;
        printer.tonerLvl = customTonerPerc;

        if (
          printer.lastReadAt != null &&
          oldToner <= 5 &&
          customTonerPerc >= 98
        ) {
          // Cambio NORMAL (estricto < 5%)
          await this.registerTonerChange(printer.assetId, 'auto_detected');
        } else if (
          printer.lastReadAt != null &&
          customTonerPerc >= 98 &&
          oldToner > 5
        ) {
          // Cambio prematuro (Guardián)
          await this.registerPrematureChange(printer.assetId, oldToner, customTonerPerc);
          await this.registerTonerChange(printer.assetId, 'auto_detected');
        } else if (
          printer.lastReadAt != null &&
          oldToner - customTonerPerc > 10 &&
          customTonerPerc !== 0
        ) {
          // Intercambio por cartucho usado/vacío (Swap)
          await this.registerSuspiciousSwap(printer.assetId, oldToner, customTonerPerc);
        } else if (
          printer.lastReadAt != null &&
          customTonerPerc > oldToner &&
          customTonerPerc < 98
        ) {
          // Relleno parcial / Tóner usado
          await this.registerSuspiciousSwap(printer.assetId, oldToner, customTonerPerc);
        }

        const calculatedKitPerc = calculatePerc(resKit, resKitMax);
        if (calculatedKitPerc !== null)
          printer.kitMttnceLvl = calculatedKitPerc;

        const calculatedImgPerc = calculatePerc(resImg, resImgMax);
        if (calculatedImgPerc !== null) printer.uniImgLvl = calculatedImgPerc;

        printer.lastReadAt = new Date();
        printer.updatedAt = new Date();

        await this.printerRepository.save(printer);
        await this.processTonerTelemetry(printer.assetId, printer.tonerLvl);
        this.logger.debug(
          `Production read for printer ${printer.assetId} (IP: ${ip}, Driver: ${brandKey}) successful.`,
        );
        return true;
      } catch (error) {
        retries++;
        this.logger.warn(
          `Failed SNMP read for IP ${ip} (Attempt ${retries}/${maxRetries}): ${error.message}`,
        );
        if (retries >= maxRetries) {
          printer.printerStatus = 'offline';
          printer.updatedAt = new Date();
          await this.printerRepository.save(printer);
          return false;
        } else {
          // delay before retry
          await new Promise((res) => setTimeout(res, 2000));
        }
      }
    }
    return false;
  }

  private readSnmpOids(ip: string, oids: string[]): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const session = snmp.createSession(ip, 'public', {
        retries: 1,
        timeout: 3000,
        version: snmp.Version2c,
      });

      session.get(oids, (error, varbinds) => {
        session.close();
        if (error || !varbinds) {
          reject(error || new Error('No varbinds returned'));
        } else {
          const results: any[] = [];
          for (let i = 0; i < varbinds.length; i++) {
            if (snmp.isVarbindError(varbinds[i])) {
              results.push(null);
            } else {
              results.push(varbinds[i].value);
            }
          }
          resolve(results);
        }
      });
    });
  }

  private async processTonerTelemetry(
    printerId: string,
    tonerLvl: number | null,
  ) {
    if (tonerLvl == null) return;

    try {
      // Delta & Daily Logging Optimization
      const lastLog = await this.printerStatusLogRepository.findOne({
        where: { printerId },
        order: { recordedAt: 'DESC' },
      });

      const today = new Date();
      let shouldSave = true;

      if (lastLog) {
        const lastDate = lastLog.recordedAt;
        const isSameDay =
          lastDate.getFullYear() === today.getFullYear() &&
          lastDate.getMonth() === today.getMonth() &&
          lastDate.getDate() === today.getDate();

        if (isSameDay && lastLog.tonerLevel === tonerLvl) {
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
      }
    } catch (e) {
      this.logger.error(
        `Error processing toner telemetry for ${printerId}: ${e.message}`,
      );
    }
  }

  private async registerPrematureChange(
    printerId: string,
    oldLevel: number,
    newLevel: number,
  ) {
    try {
      // Evitar duplicar alertas PENDING del mismo tipo
      const activeAlert = await this.alertRepository.findOne({
        where: { printerId, status: 'PENDING', type: 'PREMATURE_CHANGE' },
      });
      if (!activeAlert) {
        const alert = this.alertRepository.create({
          printerId,
          type: 'PREMATURE_CHANGE',
          status: 'PENDING',
          metadata: {
            oldLevel,
            newLevel,
            difference: newLevel - oldLevel,
            at: new Date(),
          },
        });
        await this.alertRepository.save(alert);
        this.logger.warn(`Alerta registrada PREMATURE_CHANGE para ${printerId}. Viejo: ${oldLevel}%, Nuevo: ${newLevel}%`);
      }
    } catch (e) {
      this.logger.error(`Error registering premature change for ${printerId}: ${e.message}`);
    }
  }

  private async registerSuspiciousSwap(
    printerId: string,
    oldLevel: number,
    newLevel: number,
  ) {
    try {
      const activeAlert = await this.alertRepository.findOne({
        where: { printerId, status: 'PENDING', type: 'SUSPICIOUS_SWAP' },
      });
      if (!activeAlert) {
        const alert = this.alertRepository.create({
          printerId,
          type: 'SUSPICIOUS_SWAP',
          status: 'PENDING',
          metadata: {
            oldLevel,
            newLevel,
            difference: newLevel - oldLevel,
            at: new Date(),
          },
        });
        await this.alertRepository.save(alert);
        this.logger.warn(`Alerta registrada SUSPICIOUS_SWAP para ${printerId}. Viejo: ${oldLevel}%, Nuevo: ${newLevel}%`);
      }
    } catch (e) {
      this.logger.error(`Error registering suspicious swap for ${printerId}: ${e.message}`);
    }
  }

  public async registerTonerChange(
    assetId: string,
    detectionType: 'auto_detected' | 'manual' = 'auto_detected',
  ) {
    try {
      const change = this.tonerChangeRepository.create({
        assetId,
        changedAt: new Date(),
        detectionType,
      });
      await this.tonerChangeRepository.save(change);
      this.logger.log(
        `Toner change registered for printer ${assetId} (Type: ${detectionType})`,
      );
    } catch (e) {
      this.logger.error(
        `Error registering toner change for ${assetId}: ${e.message}`,
      );
    }
  }

  private async processMonthlyClosing(
    printer: Printer,
    date: Date = new Date(),
  ) {
    const mxTime = new Date(
      date.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }),
    );
    const currentYear = mxTime.getFullYear();
    const currentMonth = mxTime.getMonth() + 1; // 1-12

    try {
      // Revisa si ya procesamos este mes (idempotencia)
      const existingStat = await this.printerMonthlyStatRepository.findOne({
        where: {
          assetId: printer.assetId,
          year: currentYear,
          month: currentMonth,
        },
      });

      if (existingStat) {
        return;
      }

      const currentTotal = parseInt(printer.totalPagesPrinted || '0', 10);
      const currentPrint = parseInt(printer.printOnlyPages || '0', 10);
      const currentCopy = parseInt(printer.copyPages || '0', 10);

      if (isNaN(currentTotal) || currentTotal <= 0) {
        return;
      }

      // Busca el ÚLTIMO registro cronológico para esta impresora
      const lastStat = await this.printerMonthlyStatRepository.findOne({
        where: { assetId: printer.assetId },
        order: { year: 'DESC', month: 'DESC' },
      });

      // Si hay un registro histórico, tomamos su "Reading" (Foto absoluta de vida de ese momento)
      // Si el registro existe pero fue creado antes de agregar la columna Reading, o si no hay registro
      // asumimos 0 deltas, simulando que fue instalada hoy.
      let lastTotal = 0;
      let lastPrint = 0;
      let lastCopy = 0;

      if (lastStat) {
        lastTotal = parseInt(lastStat.printTotalReading || '0', 10);
        lastPrint = parseInt(lastStat.printOnlyReading || '0', 10);
        lastCopy = parseInt(lastStat.copyReading || '0', 10);

        // Fallback temporal: si lastTotal sigue siendo 0 (por registros legacy sin Reading),
        // no podemos cobrar 100,000 prints de jalón. Asumiremos que el delta es 0 este mes para estabilizar.
        if (lastTotal === 0 && currentTotal > 0) {
          lastTotal = currentTotal;
          lastPrint = currentPrint;
          lastCopy = currentCopy;
        }
      } else {
        // Primer mes de vida de la impresora en el sistema. Cobramos 0.
        lastTotal = currentTotal;
        lastPrint = currentPrint;
        lastCopy = currentCopy;
      }

      // Calculamos el consumo de este mes por resta (Actual - Anterior)
      let printTotalDelta = currentTotal - lastTotal;
      let printOnlyDelta = currentPrint - lastPrint;
      let copyDelta = currentCopy - lastCopy;

      // Evitar deltas negativos por reemplazo de impresoras o reset de contadores lógicos
      if (printTotalDelta < 0) printTotalDelta = 0;
      if (printOnlyDelta < 0) printOnlyDelta = 0;
      if (copyDelta < 0) copyDelta = 0;

      const stat = this.printerMonthlyStatRepository.create({
        assetId: printer.assetId,
        year: currentYear,
        month: currentMonth,
        printTotalDelta: printTotalDelta.toString(),
        printOnlyDelta: printOnlyDelta.toString(),
        copyDelta: copyDelta.toString(),
        printTotalReading: currentTotal.toString(),
        printOnlyReading: currentPrint.toString(),
        copyReading: currentCopy.toString(),
      });
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
