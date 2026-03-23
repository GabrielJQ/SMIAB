import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import puppeteer from 'puppeteer';
import pLimit from 'p-limit';
import { Printer } from './entities/printer.entity';

/**
 * Servicio encargado de la generación de reportes visuales y envío de correos institucionales.
 * Utiliza Puppeteer para capturar evidencia visual del estado de las impresoras (Visual Scraping)
 * y garantiza la estabilidad del sistema mediante el procesamiento serial de tareas.
 * 
 * @class ReportService
 */
/**
 * @class ReportService
 * @description Servicio de alto nivel encargado de la orquestación de reportes visuales y notificaciones institucionales.
 * Utiliza Puppeteer para el "Visual Scraping" del estado de las impresoras y Mailer para el despacho de correos.
 * El servicio garantiza la estabilidad operativa mediante una arquitectura de embudo para el manejo de RAM.
 */
@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  /**
   * @private
   * @property {pLimit.Limit} limit
   * @description Embudo de ejecución (Funnel) que limita a Puppeteer a una única instancia concurrente.
   * Debido a que cada instancia consume ~200MB de RAM, esta protección previene errores de "Out of Memory" (OOM)
   * si varios usuarios solicitan reportes simultáneamente.
   */
  private readonly limit = pLimit(1);


  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    @InjectRepository(Printer)
    private readonly printerRepository: Repository<Printer>,
  ) {}

  /**
   * Genera y envía una solicitud de consumibles vía correo electrónico.
   * El proceso incluye la recuperación de datos relacionales, captura de pantalla del panel
   * de la impresora (vía Puppeteer) y el envío de un correo con formato institucional.
   * 
   * @param {string} printerId - ID único de la impresora (Asset ID).
   * @param {string} printerIp - Dirección IP para acceder al panel web.
   * @param {string} userEmail - Correo electrónico del destinatario.
   * @returns {Promise<void>}
   * @throws {InternalServerErrorException} Si hay errores en la conexión o procesamiento.
   * @memberof ReportService
   */
  /**
   * @method sendConsumableRequest
   * @description Dispara el flujo de solicitud de insumos. Realiza un SQL Join complejo para obtener
   * datos del resguardante, genera una evidencia visual (Screenshot) vía Puppeteer y despacha
   * un correo HTML con recursos incrustados (CID).
   * 
   * @param {string} printerId - UUID/AssetID de la impresora para el Join de datos.
   * @param {string} printerIp - IP de red para el acceso al panel web del dispositivo.
   * @param {string} userEmail - Destinatario final de la gestión administrativa.
   * @returns {Promise<void>}
   * @protected_by p-limit(1) - Protección de memoria para prevenir desbordamientos de RAM (OOM).
   */
  async sendConsumableRequest(printerId: string, printerIp: string, userEmail: string) {
    return this.limit(async () => {
      this.logger.log(`Iniciando solicitud de consumibles para impresora ${printerId} (${printerIp})`);
      
      // 1. Obtener información detallada de la impresora y su resguardante
      const printer = await this.printerRepository.findOne({
        where: { assetId: printerId },
        relations: [
          'asset',
          'asset.currentAssignment',
          'asset.currentAssignment.employee',
          'asset.currentAssignment.employee.department',
          'asset.currentAssignment.employee.department.address',
          'department',
          'department.unit',
        ],
      });

      if (!printer) {
        throw new InternalServerErrorException(`No se encontró la impresora con ID ${printerId}`);
      }

      const asset = printer.asset;
      const assignment = asset?.currentAssignment;
      const employee = assignment?.employee;
      const dept = employee?.department || printer.department;
      const address = dept?.address;

      // Mapeo de datos para la plantilla (con valores por defecto "N/A")
      const data = {
        marca: asset?.marca || 'N/A',
        modelo: asset?.modelo || 'N/A',
        serie: asset?.serie || 'N/A',
        ip: printer.ipPrinter || printerIp,
        resguardante: employee ? `${employee.nombre} ${employee.apellido_pat} ${employee.apellido_mat}`.trim() : 'N/A',
        email: employee?.email || 'N/A',
        centro_trabajo: 'ALIMENTACION PARA EL BIENESTAR', // Siempre este valor según el usuario
        direccion: address ? `${address.calle}, ${address.colonia}, ${address.municipio}, CP ${address.cp}` : 'N/A',
        piso: 'N/A', 
        adscripcion: dept?.areanom || 'N/A',
        area: dept?.areanom || 'N/A',
        puesto: employee?.puesto || 'N/A',
        telefono: employee?.telefono || 'N/A',
        extension: employee?.extension || 'N/A',
        horario: 'de 8:00 a.m. a 4:00 p.m.', // Formato exacto de la imagen
      };

      const snmpMode = this.configService.get<string>('SNMP_MODE', 'simulation');
      let screenshot: Buffer;

      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      try {
        const page = await browser.newPage();
        
        if (snmpMode === 'simulation') {
          this.logger.log(`Modo simulación activo para IP: ${printerIp}`);
          await page.setContent(`
            <div style="background:#eee; height:100vh; padding:50px; font-family:sans-serif;">
              <h1 style="color: #333;">Panel Simulado - SMIAB</h1>
              <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #ccc;">
                <h2>Información de Impresora</h2>
                <p><strong>ID:</strong> ${printerId}</p>
                <p><strong>IP:</strong> ${printerIp}</p>
                <p><strong>Estado:</strong> En línea (Simulado)</p>
                <div style="margin-top: 20px; height: 100px; background: #eef; border: 1px dashed #99f; display: flex; align-items: center; justify-content: center;">
                  Imagen representativa del panel de control
                </div>
              </div>
            </div>
          `);
        } else {
          try {
            this.logger.log(`Navegando a http://${printerIp}...`);
            await page.goto(`http://${printerIp}`, {
              timeout: 15000,
              waitUntil: 'networkidle0',
            });
          } catch (error) {
            this.logger.error(`Error al conectar con la impresora ${printerIp}: ${error.message}`);
            throw new InternalServerErrorException(`No se pudo conectar a la impresora en http://${printerIp}`);
          }
        }

        screenshot = (await page.screenshot({ fullPage: true })) as Buffer;

        await this.mailerService.sendMail({
          to: userEmail,
          subject: `Solicitud de Consumibles - ${data.marca} ${data.modelo} - ${data.serie}`,
          html: `
            <div style="font-family: Arial, sans-serif; color: #000; max-width: 600px; margin: 0 auto;">
              
              <!-- Mensaje Dinámico Superior -->
              <p style="margin-bottom: 20px; font-size: 15px;">
                Solicito el tóner para la impresora <strong>${data.marca}</strong> del <strong>${dept?.tipo || 'sitio'} ${dept?.areanom || ''}</strong> de <strong>${address?.municipio || 'N/A'}</strong>, se anexa formato y evidencia del porcentaje de tóner restante.
              </p>

              <div style="border: 1px solid #000;">
                <!-- Sección: Equipo -->
              <div style="background-color: #d9d9d9; padding: 5px 10px; font-weight: bold; border-bottom: 1px solid #000; font-style: italic;">
                Equipo:
              </div>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="width: 35%; padding: 4px 10px; border-bottom: 1px solid #000; border-right: 1px solid #000;">N° Serie:</td>
                  <td style="padding: 4px 10px; border-bottom: 1px solid #000;">${data.serie}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 10px; border-bottom: 1px solid #000; border-right: 1px solid #000;">I.P.:</td>
                  <td style="padding: 4px 10px; border-bottom: 1px solid #000;">${data.ip}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 10px; border-bottom: 1px solid #000; border-right: 1px solid #000;">Marca:</td>
                  <td style="padding: 4px 10px; border-bottom: 1px solid #000;">${data.marca}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 10px; border-bottom: 1px solid #000; border-right: 1px solid #000;">Modelo:</td>
                  <td style="padding: 4px 10px; border-bottom: 1px solid #000;">${data.modelo}</td>
                </tr>
              </table>

              <!-- Sección: Datos del Usuario -->
              <div style="background-color: #d9d9d9; padding: 5px 10px; font-weight: bold; border-bottom: 1px solid #000; border-top: 1px solid #000; font-style: italic;">
                Datos del Usuario:
              </div>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="width: 35%; padding: 4px 10px; border-bottom: 1px solid #000; border-right: 1px solid #000;">Solicitud o Falla:</td>
                  <td style="padding: 4px 10px; border-bottom: 1px solid #000;">Solicitud de tóner</td>
                </tr>
                <tr>
                  <td style="padding: 4px 10px; border-bottom: 1px solid #000; border-right: 1px solid #000;">Usuario:</td>
                  <td style="padding: 4px 10px; border-bottom: 1px solid #000;">${data.resguardante}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 10px; border-bottom: 1px solid #000; border-right: 1px solid #000;">Correo:</td>
                  <td style="padding: 4px 10px; border-bottom: 1px solid #000; color: #0000EE; text-decoration: underline;">${data.email}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 10px; border-bottom: 1px solid #000; border-right: 1px solid #000;">Centro de Trabajo:</td>
                  <td style="padding: 4px 10px; border-bottom: 1px solid #000;">${data.centro_trabajo}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 10px; border-bottom: 1px solid #000; border-right: 1px solid #000;">Dirección o Ubicación:</td>
                  <td style="padding: 4px 10px; border-bottom: 1px solid #000;">${data.direccion}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 10px; border-bottom: 1px solid #000; border-right: 1px solid #000;">Piso:</td>
                  <td style="padding: 4px 10px; border-bottom: 1px solid #000;">${data.piso}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 10px; border-bottom: 1px solid #000; border-right: 1px solid #000;">Adscripción:</td>
                  <td style="padding: 4px 10px; border-bottom: 1px solid #000;">${data.adscripcion}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 10px; border-bottom: 1px solid #000; border-right: 1px solid #000;">Área o Departamento:</td>
                  <td style="padding: 4px 10px; border-bottom: 1px solid #000;">${data.area}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 10px; border-bottom: 1px solid #000; border-right: 1px solid #000;">Cargo o Puesto:</td>
                  <td style="padding: 4px 10px; border-bottom: 1px solid #000;">${data.puesto}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 10px; border-bottom: 1px solid #000; border-right: 1px solid #000;">Teléfono:</td>
                  <td style="padding: 4px 10px; border-bottom: 1px solid #000;">${data.telefono}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 10px; border-bottom: 1px solid #000; border-right: 1px solid #000;">Extensión:</td>
                  <td style="padding: 4px 10px; border-bottom: 1px solid #000;">${data.extension}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 10px; border-bottom: 1px solid #000; border-right: 1px solid #000;">Horario en que se encuentra al usuario:</td>
                  <td style="padding: 4px 10px; border-bottom: 1px solid #000;">${data.horario}</td>
                </tr>
              </table>

              <!-- Captura de Pantalla -->
              <div style="padding: 15px; text-align: center; border-top: 1px solid #000;">
                <img src="cid:screenshot" alt="Panel de Impresora" style="max-width: 100%; border: 1px solid #ccc;" />
              </div>
            </div>
          `,
          attachments: [
            {
              filename: 'reporte_consumibles.png',
              content: screenshot,
              cid: 'screenshot',
            },
          ],
        });

        this.logger.log(`Correo enviado exitosamente a ${userEmail}`);
      } finally {
        await browser.close();
      }
    });
  }
}
