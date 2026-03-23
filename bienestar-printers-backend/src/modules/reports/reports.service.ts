import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import { Printer } from '../printers/entities/printer.entity';
import { PrinterMonthlyStat } from '../printers/entities/printer-monthly-stat.entity';
import { ExportReportDto, ReportType } from './dto/export-report.dto';

/**
 * @description Servicio core agnóstico para la orquestación, mapeo y generación binaria de reportes avanzados.
 * Apalancado con ExcelJS, transfiere modelos estructurados bajo una matrix visual estilizada para las áreas operativas.
 */
@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Printer)
    private readonly printerRepository: Repository<Printer>,
    @InjectRepository(PrinterMonthlyStat)
    private readonly statRepository: Repository<PrinterMonthlyStat>,
  ) {}

  /**
   * @description Central de ejecución y exportación nativa para Excel.
   * Diseña al vuelo la arquitectura del libro de trabajo, aplica combinaciones de celdas y estilizado condicional 
   * (fondos, fuentes, alertas visuales). Posteriormente itera sobre la unidad delegada para integrar las impresoras,
   * sus propiedades referenciales (ubicación de TypeORM) y contadores Delta (mensual y anual iterativo).
   * 
   * @param {string} userUnitId - Identificador cruzado (unit_id) asociado a la institución del solicitante.
   * @param {ExportReportDto} dto - Configuración del corte extraído.
   * @param {Response} res - Interfaz para streaming del buffer Excel mediante la especificación xlsx.
   * @throws {BadRequestException} Si el mes no es proveído cuando el contrato está en modo 'Mensual'.
   */
  async exportExcel(userUnitId: string, dto: ExportReportDto, res: Response) {
    if (dto.type === ReportType.MONTHLY && !dto.month) {
      throw new BadRequestException('El mes es requerido para reportes mensuales');
    }

    const printers = await this.printerRepository.find({
      where: { unitId: userUnitId },
      relations: ['asset', 'department', 'unit'],
      order: { ipPrinter: 'ASC' },
    });

    const isMonthly = dto.type === ReportType.MONTHLY;
    const sheetName = isMonthly ? `Mensual ${dto.month}-${dto.year}` : `Anual ${dto.year}`;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // Configuración de Estilos base
    const headerFont = { bold: true, color: { argb: 'FFFFFFFF' } };
    const blackFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF000000' } };
    const greenHeaderFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92D050' } };
    const ocreFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB8860B' } }; 
    const whiteFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };

    // Paleta de 12 colores pastel suaves para los meses (Ene-Dic)
    const monthColors = [
      'FFF2F2F2', 'FFDCE6F1', 'FFF2DCDB', 'FFEBF1DE', 
      'FFFDE9D9', 'FFE4DFEC', 'FFDAEEF3', 'FFFCD5B4', 
      'FFD8E4BC', 'FFB8CCE4', 'FFE6B8B7', 'FFCCC0DA'
    ];
    // Color especial para el bloque de Total Anual
    const totalAnualColor = 'FFFFFFCC';

    const monthShortNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const yearSuffix = dto.year.toString().slice(-2);

    // =========================================================================
    //  CONSTRUCCIÓN DE CABECERAS
    // =========================================================================
    const row1Data: string[] = ['SOLICITUD DE TONER', '', '', '', ''];
    const row2Data: string[] = ['IP', 'MARCA', 'MODELO', 'SERIE', 'AREA Y/O ALMACEN'];

    // Arreglo para almacenar los merges requeridos de la fila 1 (Ej: A1:E1)
    const mergesRow1: { s: number, e: number }[] = [];
    mergesRow1.push({ s: 1, e: 5 }); // Info Printer

    let colIndex = 6; // Iniciamos en la columna 6 (F)

    if (isMonthly) {
      // Formato Mensual: 1 solo bloque de 4 subcolumnas
      row1Data.push(`Mes/Año ${dto.month}/${dto.year}`, '', '', '');
      mergesRow1.push({ s: colIndex, e: colIndex + 3 });
      
      row2Data.push('impresiones', 'copia', 'TOTAL', 'MENSUAL');
      colIndex += 4;
    } else {
      // Formato Anual: 12 bloques de 4 subcolumnas
      monthShortNames.forEach((monthName) => {
        row1Data.push(`${monthName}-${yearSuffix}`, '', '', '');
        mergesRow1.push({ s: colIndex, e: colIndex + 3 });
        
        row2Data.push('impresiones', 'copia', 'TOTAL', 'MENSUAL');
        colIndex += 4;
      });

      // Bloque final de Totales del Año (4 subcolumnas)
      row1Data.push(`Totales Año ${dto.year}`, '', '', '');
      mergesRow1.push({ s: colIndex, e: colIndex + 3 });
      row2Data.push('impresiones', 'copia', 'TOTAL', 'TOTAL ANUAL');
      colIndex += 4;
    }

    // Bloque de Consumibles
    const levelsColStart = colIndex;
    row1Data.push(`Niveles al ${new Date().toLocaleDateString('es-MX')}`, '', '');
    mergesRow1.push({ s: colIndex, e: colIndex + 2 });
    row2Data.push('toner %', 'Unidad de Imagen', 'Kit de Mantto.');

    // Insertamos filas
    const row1 = worksheet.addRow(row1Data);
    const row2 = worksheet.addRow(row2Data);

    // =========================================================================
    //  APLICACIÓN DE MERGES Y ESTILOS
    // =========================================================================
    mergesRow1.forEach(merge => {
      // ExcelJS mergeCells index-based: (rmin, cmin, rmax, cmax)
      worksheet.mergeCells(1, merge.s, 1, merge.e);
    });

    // Estilos Fila 1
    row1.getCell(1).fill = whiteFill;
    row1.getCell(1).font = { bold: true, size: 12 };
    
    // Rellenos Fila 1 (Negro para impresiones)
    if (isMonthly) {
      row1.getCell(6).fill = blackFill;
      row1.getCell(6).font = headerFont;
    } else {
      // Cada bloque mensual y el anual lleva fondo negro en la cabecera
      for (let c = 6; c < levelsColStart; c += 4) {
        row1.getCell(c).fill = blackFill;
        row1.getCell(c).font = headerFont;
      }
    }

    // Relleno Fila 1 (Ocre para Niveles)
    row1.getCell(levelsColStart).fill = ocreFill;
    row1.getCell(levelsColStart).font = headerFont;


    // Estilos Fila 2
    for(let i=1; i<=5; i++) {
        row2.getCell(i).fill = blackFill;
        row2.getCell(i).font = headerFont;
    }
    
    // Impresiones (Subcabeceras)
    if (isMonthly) {
      for(let i=6; i<levelsColStart; i++) {
          row2.getCell(i).fill = greenHeaderFill;
          row2.getCell(i).font = { bold: true };
      }
    } else {
      let col = 6;
      for (let m = 0; m < 12; m++) {
        const monthFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: monthColors[m] } };
        for (let c = 0; c < 4; c++) {
          row2.getCell(col).fill = monthFill;
          row2.getCell(col).font = { bold: true };
          col++;
        }
      }
      // Bloque Total Anual
      const totalFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: totalAnualColor } };
      for (let c = 0; c < 4; c++) {
        row2.getCell(col).fill = totalFill;
        row2.getCell(col).font = { bold: true };
        col++;
      }
    }

    // Niveles
    for(let i=levelsColStart; i<=levelsColStart+2; i++) {
        row2.getCell(i).fill = ocreFill;
        row2.getCell(i).font = { bold: true };
    }


    // =========================================================================
    //  ANCHOS DE COLUMNAS
    // =========================================================================
    const columnsConfig: Partial<ExcelJS.Column>[] = [
      { width: 15 }, { width: 13 }, { width: 13 }, { width: 22 }, { width: 28 } // Bloque inicial
    ];
    // Impresiones
    for (let i = 6; i < levelsColStart; i++) {
      columnsConfig.push({ width: 12 });
    }
    // Consumibles
    columnsConfig.push({ width: 12 }, { width: 18 }, { width: 18 });
    worksheet.columns = columnsConfig;


    // =========================================================================
    //  POBLADO DE DATOS (FILAS DE IMPRESORAS)
    // =========================================================================
    for (const printer of printers) {
      const area = printer.department?.areanom || printer.unit?.uninom || '';
      const marca = printer.asset?.marca || '';
      const modelo = printer.asset?.modelo || '';
      const serie = printer.asset?.serie || '';

      const tonerLvl = printer.tonerLvl;
      const resolvedImgLvl = printer.uniImgLvl > 0 ? printer.uniImgLvl : null;
      const resolvedKitLvl = printer.kitMttnceLvl > 0 ? printer.kitMttnceLvl : null;

      const rowData: unknown[] = [printer.ipPrinter, marca, modelo, serie, area];

      if (isMonthly) {
        const stat = await this.statRepository.findOne({
          where: { assetId: printer.assetId, year: dto.year, month: dto.month }
        });
        const impresiones = stat ? (Number(stat.printOnlyDelta) || 0) : 0;
        const copia = stat ? (Number(stat.copyDelta) || 0) : 0;
        const deltaPeriodo = stat ? (Number(stat.printTotalDelta) || 0) : 0;
        const total = impresiones + copia;
        
        rowData.push(impresiones, copia, total, deltaPeriodo);

      } else {
        // Año Completo
        const stats = await this.statRepository.find({
          where: { assetId: printer.assetId, year: dto.year }
        });
        
        let yearlyImpresiones = 0;
        let yearlyCopia = 0;
        let yearlyTotalCalculado = 0;
        let yearlyDeltaPeriodo = 0;

        for (let m = 1; m <= 12; m++) {
          const mStat = stats.find(s => s.month === m);
          
          const mImpresiones = mStat ? (Number(mStat.printOnlyDelta) || 0) : 0;
          const mCopia = mStat ? (Number(mStat.copyDelta) || 0) : 0;
          const mDeltaPeriodo = mStat ? (Number(mStat.printTotalDelta) || 0) : 0;
          const mTotal = mImpresiones + mCopia;

          rowData.push(mImpresiones, mCopia, mTotal, mDeltaPeriodo);

          yearlyImpresiones += mImpresiones;
          yearlyCopia += mCopia;
          yearlyTotalCalculado += mTotal;
          yearlyDeltaPeriodo += mDeltaPeriodo;
        }
        
        // Bloque del Total Anual
        rowData.push(yearlyImpresiones, yearlyCopia, yearlyTotalCalculado, yearlyDeltaPeriodo);
      }
      
      rowData.push(tonerLvl, resolvedImgLvl, resolvedKitLvl);

      const row = worksheet.addRow(rowData);

      // Colorear las filas de datos para la vista anual
      if (!isMonthly) {
        let col = 6;
        for (let m = 0; m < 12; m++) {
          const monthFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: monthColors[m] } };
          for (let c = 0; c < 4; c++) {
            row.getCell(col).fill = monthFill;
            col++;
          }
        }
        // Total Anual
        const totalFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: totalAnualColor } };
        for (let c = 0; c < 4; c++) {
          row.getCell(col).fill = totalFill;
          col++;
        }
      }

      // Resaltar en rojo si toner <= 20%
      if (tonerLvl <= 20) {
        row.getCell(levelsColStart).font = { color: { argb: 'FFFF0000' }, bold: true };
      }
    }

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Reporte_SMIAB_${dto.type}_${dto.year}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  }
}
