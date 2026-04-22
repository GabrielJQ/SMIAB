import { SnmpDriver } from '../interfaces/snmp-driver.interface';
import { SnmpDriverConfig } from '../../constants/oids.constants';

/**
 * @class BaseSnmpDriver
 * @description Clase base abstracta que implementa la lógica común de lectura SNMP.
 * Proporciona métodos genéricos para evitar duplicidad de código en drivers específicos.
 */
export abstract class BaseSnmpDriver implements SnmpDriver {
  abstract getBrand(): string;

  /**
   * @method getTonerLevel
   * @description Implementación estándar: Lee el nivel actual y lo compara con el máximo para obtener el %.
   */
  async getTonerLevel(session: any, config: SnmpDriverConfig): Promise<number> {
    const current = await this.snmpGet(session, config.tonerLevel);
    const max = config.tonerMaxCapacity 
      ? await this.snmpGet(session, config.tonerMaxCapacity) 
      : 100;

    if (!max || max <= 0) return current;
    const percentage = Math.round((current / max) * 100);
    return percentage > 100 ? 100 : percentage;
  }

  async getTotalPages(session: any, config: SnmpDriverConfig): Promise<number> {
    return await this.snmpGet(session, config.totalPages);
  }

  async getModelName(session: any, oids: any): Promise<string> {
    // Implementación por defecto usando el OID de descripción del sistema o modelo si existe
    return 'Desconocido'; 
  }

  async getSerialNumber(session: any, oids: any): Promise<string> {
    return 'N/A';
  }

  /**
   * @method snmpGet
   * @description Envuelve la llamada callback de net-snmp en una Promesa.
   * @protected
   */
  protected snmpGet(session: any, oid: string): Promise<number> {
    return new Promise((resolve, reject) => {
      session.get([oid], (error, varbinds) => {
        if (error) {
          return reject(error);
        }
        const value = varbinds[0].value;
        resolve(Number(value));
      });
    });
  }

  /**
   * @method snmpGetStr
   * @description Versión para obtener strings (Modelo, Serie).
   * @protected
   */
  protected snmpGetStr(session: any, oid: string): Promise<string> {
    return new Promise((resolve, reject) => {
      session.get([oid], (error, varbinds) => {
        if (error) return reject(error);
        resolve(varbinds[0].value.toString());
      });
    });
  }
}
