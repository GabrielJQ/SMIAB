import { LexmarkDriver } from './implementations/lexmark.driver';
import { KyoceraDriver } from './implementations/kyocera.driver';
import { GenericDriver } from './implementations/generic.driver';
import { SnmpDriver } from './interfaces/snmp-driver.interface';

export class SnmpDriverFactory {
  private static drivers = {
    lexmark: new LexmarkDriver(),
    kyocera: new KyoceraDriver(),
    generic: new GenericDriver(),
  };

  /**
   * @method getDriver
   * @description Determina el driver correcto basado en la descripción del sistema (sysDescr).
   * @param {string} sysDescr - Respuesta del OID 1.3.6.1.2.1.1.1.0
   */
  static getDriver(sysDescr: string): SnmpDriver {
    const desc = sysDescr.toLowerCase();
    
    if (desc.includes('lexmark')) {
      return this.drivers.lexmark;
    }
    
    if (desc.includes('kyocera')) {
      return this.drivers.kyocera;
    }

    return this.drivers.generic;
  }
}
