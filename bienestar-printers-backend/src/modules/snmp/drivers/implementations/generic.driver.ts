import { BaseSnmpDriver } from './base-snmp.driver';

export class GenericDriver extends BaseSnmpDriver {
  getBrand(): string {
    return 'Generic';
  }
}
