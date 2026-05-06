import { BaseSnmpDriver } from './base-snmp.driver';
import { SnmpDriverConfig } from '../../constants/oids.constants';

export class KyoceraDriver extends BaseSnmpDriver {
  getBrand(): string {
    return 'Kyocera';
  }

  /**
   * @method getTotalPages
   * @description Implementa fallback para obtener el contador de facturación real.
   */
  async getTotalPages(session: any, config: SnmpDriverConfig): Promise<number> {
    // Intentar OID propietario de Facturación de Kyocera
    const billingOids = [
      '1.3.6.1.4.1.1347.46.10.1.1.5.1', 
    ];

    for (const oid of billingOids) {
      try {
        const pages = await this.snmpGet(session, oid);
        // Validar que regrese un número lógico
        if (pages !== null && pages !== undefined && !isNaN(pages) && pages >= 0) {
          return pages;
        }
      } catch (error) {
        // Ignorar error y seguir intentando o caer al fallback
      }
    }

    // Fallback al contador mecánico por defecto
    return super.getTotalPages(session, config);
  }
}
