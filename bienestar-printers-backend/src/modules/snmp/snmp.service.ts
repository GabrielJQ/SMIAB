import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Printer } from '../printers/entities/printer.entity';
import { PrinterMonthlyStat } from '../printers/entities/printer-monthly-stat.entity';
import * as snmp from 'net-snmp';

type SnmpDriver = {
    totalPages: string;
    printOnly: string | null;
    copyOnly: string | null;
    tonerLevel: string;
    tonerMaxCapacity: string | null;
    maintenanceKit: string | null;
    imageUnit: string | null;
};

const SNMP_DRIVERS: Record<string, SnmpDriver> = {
    kyocera: {
        totalPages: '1.3.6.1.2.1.43.10.2.1.4.1.1',
        printOnly: '1.3.6.1.4.1.1347.43.10.1.1.12.1.1',
        copyOnly: '1.3.6.1.4.1.1347.43.10.1.1.12.1.2',
        tonerLevel: '1.3.6.1.2.1.43.11.1.1.9.1.1',
        tonerMaxCapacity: '1.3.6.1.2.1.43.11.1.1.8.1.1',
        maintenanceKit: '1.3.6.1.2.1.43.11.1.1.9.1.2',
        imageUnit: '1.3.6.1.2.1.43.11.1.1.9.1.3',
    },
    lexmark: {
        totalPages: '1.3.6.1.2.1.43.10.2.1.4.1.1',
        printOnly: null,
        copyOnly: null,
        tonerLevel: '1.3.6.1.2.1.43.11.1.1.9.1.1',
        tonerMaxCapacity: '1.3.6.1.2.1.43.11.1.1.8.1.1',
        maintenanceKit: null,
        imageUnit: null,
    },
    generic: {
        totalPages: '1.3.6.1.2.1.43.10.2.1.4.1.1',
        printOnly: null,
        copyOnly: null,
        tonerLevel: '1.3.6.1.2.1.43.11.1.1.9.1.1',
        tonerMaxCapacity: '1.3.6.1.2.1.43.11.1.1.8.1.1',
        maintenanceKit: null,
        imageUnit: null,
    }
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
        private readonly configService: ConfigService,
    ) {
        this.snmpMode = this.configService.get<string>('SNMP_MODE') || 'simulation';
        this.logger.log(`SNMP Service initialized in ${this.snmpMode} mode`);
    }

    onModuleInit() {
        this.logger.log('Arrancando primera lectura forzada al iniciar el servidor...');
        // Execute background sweep on startup
        this.readPrinters().catch(err => this.logger.error('Error in initial SNMP sweep', err));
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
        if (month === 1 && dateDay === 1) return false;   // Año Nuevo
        if (month === 5 && dateDay === 1) return false;   // Día del Trabajo
        if (month === 9 && dateDay === 16) return false;  // Independencia
        if (month === 12 && dateDay === 25) return false; // Navidad
        // Presidential transition (Oct 1 every 6 years starting 2024)
        if (month === 10 && dateDay === 1 && (mxTime.getFullYear() - 2024) % 6 === 0) return false;

        // Floating holidays
        // First Monday of February
        if (month === 2 && day === 1 && dateDay <= 7) return false;
        // Third Monday of March
        if (month === 3 && day === 1 && dateDay >= 15 && dateDay <= 21) return false;
        // Third Monday of November
        if (month === 11 && day === 1 && dateDay >= 15 && dateDay <= 21) return false;

        return true;
    }

    private isWorkingHours(date = new Date()): boolean {
        const mxTime = new Date(date.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));

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
        const mxTime = new Date(date.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));

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

    @Cron('*/15 * * * *')
    async readPrinters() {
        if (!this.isWorkingHours()) {
            this.logger.debug('Fuera de horario laboral. Omitiendo barrido SNMP.');
            return;
        }

        this.logger.log('Starting 15-minute SNMP sweep...');

        // Get all printers where IP is not null
        const printers = await this.printerRepository.createQueryBuilder('printer')
            .where('printer.ip_printer IS NOT NULL')
            .getMany();

        if (printers.length === 0) {
            this.logger.log('No printers found with an IP address.');
            return;
        }

        const now = new Date();
        const isClosingDay = this.isLastWorkingDayOfMonth(now);

        for (const printer of printers) {
            let success = false;
            if (this.snmpMode === 'simulation') {
                success = await this.simulateRead(printer);
            } else {
                success = await this.productionRead(printer);
            }

            if (success && isClosingDay) {
                await this.processMonthlyClosing(printer, now);
            }
        }

        this.logger.log('Finished 15-minute SNMP sweep.');
    }

    private async simulateRead(printer: Printer): Promise<boolean> {
        // Generate random values
        const statusValues = ['online', 'offline', 'UNKNOWN'];
        const randomStatus = statusValues[Math.floor(Math.random() * statusValues.length)];
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

        printer.printerStatus = randomStatus;
        printer.tonerLvl = randomToner;
        printer.kitMttnceLvl = randomKit;
        printer.uniImgLvl = randomImg;
        printer.totalPagesPrinted = newPages.toString();
        printer.printOnlyPages = newPrints.toString();
        printer.copyPages = newCopies.toString();
        printer.lastReadAt = new Date();
        printer.updatedAt = new Date();

        await this.printerRepository.save(printer);
        this.logger.debug(`Simulated read for printer ${printer.assetId} (IP: ${printer.ipPrinter}). Status: ${randomStatus}`);
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
                    this.logger.debug(`Fallo al leer sysDescr en ${ip}, usando driver generic.`);
                }

                const driver = SNMP_DRIVERS[brandKey];

                // 2. Construir lista dinámica de OIDs según el driver
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
                }

                if (driver.imageUnit) {
                    oidsToRequest.push(driver.imageUnit);
                    oidMap['imageUnit'] = idx++;
                }

                // 3. Ejecutar lectura con el array filtrado
                const result = await this.readSnmpOids(ip, oidsToRequest);

                // 4. Mapear respuestas
                const resTotalPages = result[oidMap['totalPages']];
                const resPrintOnly = driver.printOnly ? result[oidMap['printOnly']] : resTotalPages;
                const resCopyOnly = driver.copyOnly ? result[oidMap['copyOnly']] : 0;

                const resTonerLevel = result[oidMap['tonerLevel']];
                const resTonerMax = driver.tonerMaxCapacity ? result[oidMap['tonerMaxCapacity']] : null;
                const resKit = driver.maintenanceKit ? result[oidMap['maintenanceKit']] : null;
                const resImg = driver.imageUnit ? result[oidMap['imageUnit']] : null;

                // 5. Normalizar porcentaje de tóner
                let customTonerPerc = 0;
                if (resTonerMax && resTonerLevel && typeof resTonerMax === 'number' && typeof resTonerLevel === 'number' && resTonerMax > 0) {
                    customTonerPerc = Math.floor((resTonerLevel / resTonerMax) * 100);
                } else if (typeof resTonerLevel === 'number') {
                    customTonerPerc = resTonerLevel;
                }

                // Asegurar cotas 0-100
                if (customTonerPerc < 0) customTonerPerc = 0;
                if (customTonerPerc > 100) customTonerPerc = 100;

                // 6. Asignar al modelo
                printer.printerStatus = 'online';
                printer.totalPagesPrinted = resTotalPages?.toString() || printer.totalPagesPrinted;
                printer.printOnlyPages = resPrintOnly?.toString() || printer.printOnlyPages || printer.totalPagesPrinted;
                printer.copyPages = resCopyOnly?.toString() || printer.copyPages || '0';

                printer.tonerLvl = customTonerPerc;

                if (typeof resKit === 'number') printer.kitMttnceLvl = resKit;
                if (typeof resImg === 'number') printer.uniImgLvl = resImg;

                printer.lastReadAt = new Date();
                printer.updatedAt = new Date();

                await this.printerRepository.save(printer);
                this.logger.debug(`Production read for printer ${printer.assetId} (IP: ${ip}, Driver: ${brandKey}) successful.`);
                return true;
            } catch (error) {
                retries++;
                this.logger.warn(`Failed SNMP read for IP ${ip} (Attempt ${retries}/${maxRetries}): ${error.message}`);
                if (retries >= maxRetries) {
                    printer.printerStatus = 'offline';
                    printer.lastReadAt = new Date();
                    printer.updatedAt = new Date();
                    await this.printerRepository.save(printer);
                    return false;
                } else {
                    // delay before retry
                    await new Promise(res => setTimeout(res, 2000));
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

    private async processMonthlyClosing(printer: Printer, date: Date = new Date()) {
        const mxTime = new Date(date.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
        const currentYear = mxTime.getFullYear();
        const currentMonth = mxTime.getMonth() + 1; // 1-12

        try {
            // Revisa si ya procesamos este mes (idempotencia)
            const existingStat = await this.printerMonthlyStatRepository.findOne({
                where: {
                    assetId: printer.assetId,
                    year: currentYear,
                    month: currentMonth
                }
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
                order: { year: 'DESC', month: 'DESC' }
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
                copyReading: currentCopy.toString()
            });
            stat.updatedAt = new Date();

            await this.printerMonthlyStatRepository.save(stat);
            this.logger.debug(`Monthly stat saved for printer ${printer.assetId}. Total Delta: ${printTotalDelta}, Print: ${printOnlyDelta}, Copy: ${copyDelta}`);
        } catch (err) {
            this.logger.error(`Error processing monthly closing for printer ${printer.assetId}`, err.stack);
        }
    }
}
