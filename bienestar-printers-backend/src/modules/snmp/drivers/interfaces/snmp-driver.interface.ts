/**
 * @interface SnmpDriver
 * @description Define el contrato estándar que deben seguir todos los drivers de marcas de impresoras.
 * Permite que el SnmpService trabaje con abstracciones en lugar de implementaciones concretas (SOLID - DIP).
 */
export interface SnmpDriver {
  /**
   * @method getBrand
   * @returns {string} El nombre de la marca que maneja el driver.
   */
  getBrand(): string;

  /**
   * @method getTonerLevel
   * @description Obtiene el nivel de tóner normalizado (0-100).
   */
  getTonerLevel(session: any, oids: any): Promise<number>;

  /**
   * @method getTotalPages
   * @description Obtiene el contador total de impresiones.
   */
  getTotalPages(session: any, oids: any): Promise<number>;

  /**
   * @method getModelName
   * @description Obtiene el nombre del modelo reportado por el dispositivo.
   */
  getModelName(session: any, oids: any): Promise<string>;

  /**
   * @method getSerialNumber
   * @description Obtiene el número de serie único del dispositivo.
   */
  getSerialNumber(session: any, oids: any): Promise<string>;
}
