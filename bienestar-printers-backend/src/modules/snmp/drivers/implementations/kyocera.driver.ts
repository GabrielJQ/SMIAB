import { BaseSnmpDriver } from './base-snmp.driver';

export class KyoceraDriver extends BaseSnmpDriver {
  getBrand(): string {
    return 'Kyocera';
  }
}
