import { getPrintersByUnitQuery } from '../../../../src/modules/printers/queries/get-printers-by-unit.query';
import { getPrinterHistoryQuery } from '../../../../src/modules/printers/queries/get-printer-history.query';
import { Repository } from 'typeorm';

describe('Printers Queries', () => {

  describe('getPrintersByUnitQuery', () => {
    it('debería ejecutar el método find de TypeORM invocando relations y order de forma estricta', async () => {
      const mockRepository = {
        find: jest.fn().mockResolvedValue(['fakePrinterObj']),
      };

      const result = await getPrintersByUnitQuery(mockRepository as any, 'unit-123');

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { unitId: 'unit-123' },
        relations: ['department'],
        order: { namePrinter: 'ASC' },
      });
      expect(result).toEqual(['fakePrinterObj']);
    });
  });

  describe('getPrinterHistoryQuery', () => {
    let mockQueryBuilder: any;
    let mockRepository: any;

    beforeEach(() => {
      // Un TypeORM QueryBuilder encadena los llamados retornándose a sí mismo
      mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ fakeStat: true }]),
      };

      mockRepository = {
        createQueryBuilder: jest.fn(() => mockQueryBuilder),
      };
    });

    it('debería construir la consulta básica si no se envían filtros de fechas', async () => {
      const result = await getPrinterHistoryQuery(mockRepository, { printerId: 'prn-01' });

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('stats');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('stats.asset_id = :printerId', { printerId: 'prn-01' });
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled(); // No debe añadir filtros if()
      expect(result).toEqual([{ fakeStat: true }]);
    });

    it('debería inyectar filtros lógicos para startYear y endYear condicionalmente', async () => {
      await getPrinterHistoryQuery(mockRepository, {
        printerId: 'prn-01',
        startYear: 2023,
        startMonth: 6,
        endYear: 2024,
        // endMonth es omitido para validar fallbacks
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(2);
      
      // Valida la inyección estricta para la fecha mínima
      expect(mockQueryBuilder.andWhere).toHaveBeenNthCalledWith(
        1,
        '(stats.year > :startYear OR (stats.year = :startYear AND stats.month >= :startMonth))',
        { startYear: 2023, startMonth: 6 }
      );

      // Valida la inyección para la fecha máxima (el motor asume el mes 12 por default si no se provee)
      expect(mockQueryBuilder.andWhere).toHaveBeenNthCalledWith(
        2,
        '(stats.year < :endYear OR (stats.year = :endYear AND stats.month <= :endMonth))',
        { endYear: 2024, endMonth: 12 }
      );
    });
  });
});
