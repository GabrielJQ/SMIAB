/**
 * @description Define la estructura de OIDs (Object Identifiers) necesarios para extraer 
 * telemetría específica de una marca o modelo de impresora.
 */
export type SnmpDriverConfig = {
  totalPages: string;
  printOnly: string | null;
  copyOnly: string | null;
  tonerLevel: string;
  tonerMaxCapacity: string | null;
  maintenanceKit: string | null;
  maintenanceKitMax: string | null;
  imageUnit: string | null;
  imageUnitMax: string | null;
};

/**
 * @description Diccionario de perfiles OID por fabricante. 
 * El perfil 'generic' actúa como fallback basado en el estándar RFC 1213/3805.
 */
export const SNMP_DRIVERS_CONFIG: Record<string, SnmpDriverConfig> = {
  kyocera: {
    totalPages: '1.3.6.1.4.1.1347.43.10.1.1.12.1.1',
    printOnly: null,
    copyOnly: null,
    tonerLevel: '1.3.6.1.2.1.43.11.1.1.9.1.1',
    tonerMaxCapacity: '1.3.6.1.2.1.43.11.1.1.8.1.1',
    maintenanceKit: '1.3.6.1.2.1.43.11.1.1.9.1.2',
    maintenanceKitMax: '1.3.6.1.2.1.43.11.1.1.8.1.2',
    imageUnit: '1.3.6.1.2.1.43.11.1.1.9.1.3',
    imageUnitMax: '1.3.6.1.2.1.43.11.1.1.8.1.3',
  },
  lexmark: {
    totalPages: '1.3.6.1.2.1.43.10.2.1.4.1.1',
    printOnly: null,
    copyOnly: null,
    tonerLevel: '1.3.6.1.2.1.43.11.1.1.9.1.3',
    tonerMaxCapacity: '1.3.6.1.2.1.43.11.1.1.8.1.3',
    maintenanceKit: '1.3.6.1.2.1.43.11.1.1.9.1.4',
    maintenanceKitMax: '1.3.6.1.2.1.43.11.1.1.8.1.4',
    imageUnit: '1.3.6.1.2.1.43.11.1.1.9.1.2',
    imageUnitMax: '1.3.6.1.2.1.43.11.1.1.8.1.2',
  },
  generic: {
    totalPages: '1.3.6.1.2.1.43.10.2.1.4.1.1',
    printOnly: null,
    copyOnly: null,
    tonerLevel: '1.3.6.1.2.1.43.11.1.1.9.1.1',
    tonerMaxCapacity: '1.3.6.1.2.1.43.11.1.1.8.1.1',
    maintenanceKit: '1.3.6.1.2.1.43.11.1.1.9.1.2',
    maintenanceKitMax: '1.3.6.1.2.1.43.11.1.1.8.1.2',
    imageUnit: '1.3.6.1.2.1.43.11.1.1.9.1.3',
    imageUnitMax: '1.3.6.1.2.1.43.11.1.1.8.1.3',
  },
};

/**
 * @description OID estándar para obtener la descripción del sistema.
 */
export const SYS_DESCR_OID = '1.3.6.1.2.1.1.1.0';
