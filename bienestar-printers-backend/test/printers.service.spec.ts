import { Test, TestingModule } from '@nestjs/testing';
import { PrintersService } from '../src/modules/printers/printers.service';
import { BadRequestException } from '@nestjs/common';
import * as xlsx from 'xlsx';

function createMockExcelBuffer(data: any[][]): Buffer {
  const ws = xlsx.utils.aoa_to_sheet(data);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, 'Sheet1');
  return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
}
import { getRepositoryToken } from '@nestjs/typeorm';
import { Printer } from '../src/modules/printers/entities/printer.entity';
import { PrinterMonthlyStat } from '../src/modules/printers/entities/printer-monthly-stat.entity';
import { PrinterStatusLog } from '../src/modules/printers/entities/printer-status-log.entity';
import { PrinterTonerChange } from '../src/modules/toners/entities/printer-toner-change.entity';
import { Alert } from '../src/modules/printers/entities/alert.entity';
import { SupabaseService } from '../src/integrations/supabase/supabase.service';

describe('PrintersService', () => {
  let service: PrintersService;
  let mockRepository: any;

  beforeEach(async () => {
    // Definimos mocks básicos para simular la base de datos
    const mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(2), // Por ejemplo, 2 online
    };

    mockRepository = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockReturnValue({}),
      save: jest.fn().mockResolvedValue({}),
      count: jest.fn().mockResolvedValue(5), // Por ejemplo, 5 impresoras totales
      createQueryBuilder: jest.fn(() => mockQueryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrintersService,
        {
          provide: getRepositoryToken(Printer),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(PrinterMonthlyStat),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(PrinterStatusLog),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(PrinterTonerChange),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Alert),
          useValue: mockRepository,
        },
        {
          provide: SupabaseService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<PrintersService>(PrintersService);
  });

  it('debería estar definido (should be defined)', () => {
    expect(service).toBeDefined();
  });

  describe('getOperationalStatus', () => {
    it('debería calcular correctamente totales, online y offline de las impresoras', async () => {
      // Act
      const result = await service.getOperationalStatus('unit-123');

      // Assert
      expect(result).toBeDefined();
      expect(result.total).toBe(5);
      expect(result.online).toBe(2);
      expect(result.offline).toBe(3); // 5 - 2
    });

    it('debería lanzar error si no se proporciona userUnitId', async () => {
      await expect(service.getOperationalStatus('')).rejects.toThrow(
        'User has no unit assigned',
      );
    });
  });

  describe('processExcelHistory', () => {
    it('debería arrojar un error si falta la columna "ip"', async () => {
      const data = [['otra_columna'], ['valor']];
      const buffer = createMockExcelBuffer(data);
      
      await expect(service.processExcelHistory(buffer, 2025, 3)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debería procesar filas correctamente en formato "Ancho"', async () => {
      // Configuramos mock para encontrar la IP correcta
      mockRepository.findOne.mockImplementation(async ({ where }: any) => {
        if (where && where.ipPrinter === '192.168.1.10') {
          return { assetId: 'printer-123', ipPrinter: '192.168.1.10' };
        }
        return null;
      });

      // El mockRepository.create ya devuelve un objeto vacío mockeado, lo cual es suficiente
      // Formato ancho: IP, ene-25
      const data = [
        ['ip', 'ene-25', '', '', ''], // Cabecera
        ['', 'impresiones', 'copia', 'total', 'mensual'], // SubCabecera
        ['192.168.1.10', 500, 100, 600, 600], // Fila válida
        ['192.168.1.99', 100, 10, 110, 110],  // Fila inválida (IP no encontrada)
      ];
      const buffer = createMockExcelBuffer(data);

      const result = await service.processExcelHistory(buffer, 2025, 3);
      
      expect(result.processed).toBe(1); // 1 fila válida procesada
      expect(result.errors.length).toBe(1); // 1 error (IP 192.168.1.99 no encontrada)
      expect(mockRepository.save).toHaveBeenCalled(); // Se debe haber llamado save en el repositorio
    });

    it('debería procesar filas correctamente en formato "Largo"', async () => {
      mockRepository.findOne.mockImplementation(async ({ where }: any) => {
        if (where && where.ipPrinter === '10.0.0.5') {
          return { assetId: 'printer-xyz', ipPrinter: '10.0.0.5' };
        }
        return null;
      });

      // Formato largo (Explicit Month and Year per row)
      const data = [
        ['ip', 'Mes', 'Año', 'total', 'mensual'],
        ['10.0.0.5', 'febrero', 2025, 300, 150], // Fila procesable válida
        ['10.0.0.5', 'sin_mes', '', 10, 10], // Omitida por falta de año/mes
      ];
      const buffer = createMockExcelBuffer(data);

      const result = await service.processExcelHistory(buffer, 2025, 2);
      
      expect(result.processed).toBe(1);
    });
  });
});
