import { BaseSnmpDriver } from './base-snmp.driver';
import { SnmpDriverConfig } from '../../constants/oids.constants';

export class LexmarkDriver extends BaseSnmpDriver {
  getBrand(): string {
    return 'Lexmark';
  }

  /**
   * @method getTonerLevel
   * @description Implementación con descubrimiento dinámico para Lexmark.
   */
  async getTonerLevel(session: any, config: SnmpDriverConfig): Promise<number> {
    const dynamicConfig = { ...config };
    
    try {
      // Descubrimiento dinámico de suministros (OIDs 1.3.6.1.2.1.43.11.1.1.6.1.1 a 5)
      const discoveryOids = [
        '1.3.6.1.2.1.43.11.1.1.6.1.1',
        '1.3.6.1.2.1.43.11.1.1.6.1.2',
        '1.3.6.1.2.1.43.11.1.1.6.1.3',
        '1.3.6.1.2.1.43.11.1.1.6.1.4',
        '1.3.6.1.2.1.43.11.1.1.6.1.5',
      ];

      const descriptions = await this.readMultipleOids(session, discoveryOids);
      
      const normalize = (str: string) =>
        str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

      descriptions.forEach((desc, i) => {
        if (!desc) return;
        const d = normalize(desc.toString());
        const idx = i + 1;

        if (d.includes('cartucho') || d.includes('negro') || d.includes('black') || d.includes('ner')) {
          dynamicConfig.tonerLevel = `1.3.6.1.2.1.43.11.1.1.9.1.${idx}`;
          dynamicConfig.tonerMaxCapacity = `1.3.6.1.2.1.43.11.1.1.8.1.${idx}`;
        }
      });
    } catch (e) {
      // Si falla el descubrimiento, usamos los OIDs por defecto de la config
    }

    return super.getTonerLevel(session, dynamicConfig);
  }

  /**
   * @method readMultipleOids
   * @private Helper para leer múltiples OIDs en una sola sesión.
   */
  private readMultipleOids(session: any, oids: string[]): Promise<any[]> {
    return new Promise((resolve, reject) => {
      session.get(oids, (error, varbinds) => {
        if (error) return reject(error);
        resolve(varbinds.map(vb => vb.value));
      });
    });
  }
}
