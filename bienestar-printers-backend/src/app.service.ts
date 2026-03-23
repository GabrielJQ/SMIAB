import { Injectable } from '@nestjs/common';

/**
 * @class AppService
 * @description Constiene lógica de negocio base a nivel raíz. Normalmente usado para rutas de bienvenida o Health Checks.
 */
@Injectable()
export class AppService {
  /**
   * @method getHello
   * @description Método de demostración por defecto de NestJS.
   * @returns {string} Mensaje de saludo.
   */
  getHello(): string {
    return 'Hello World!';
  }
}
