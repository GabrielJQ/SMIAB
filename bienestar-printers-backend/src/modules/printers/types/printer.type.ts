/**
 * @interface Printer
 * @description Interfaz de dominio que define la estructura base de una impresora en el sistema.
 * Representa el estado actual y los niveles de telemetría capturados mediante SNMP o actualizaciones manuales.
 */
export interface Printer {
  /** @property {string} assetId - Identificador único del activo (Tag/UUID). */
  assetId: string;
  /** @property {string} namePrinter - Nombre descriptivo o marca del dispositivo. */
  namePrinter: string;
  /** @property {string} departmentId - Identificador del área o departamento asignado. */
  departmentId: string;
  /** @property {string} unitId - Identificador de la unidad administrativa (unidad de negocio). */
  unitId: string;
  /** @property {string} regionId - Identificador de la región geográfica. */
  regionId: string;
  /** @property {string} printerStatus - Estado operativo (ej: ONLINE, OFFLINE, ERROR). */
  printerStatus: string;
  /** @property {number} tonerLvl - Porcentaje actual de nivel de tóner (0-100). */
  tonerLvl: number;
  /** @property {number} kitMttnceLvl - Nivel de vida útil del kit de mantenimiento. */
  kitMttnceLvl: number;
  /** @property {number} uniImgLvl - Nivel de vida útil de la unidad de imagen. */
  uniImgLvl: number;
  /** @property {number} totalPagesPrinted - Contador acumulado histórico de páginas impresas. */
  totalPagesPrinted: number;
  /** @property {string} lastReadAt - Marca temporal de la última lectura exitosa de telemetría. */
  lastReadAt: string;
}

