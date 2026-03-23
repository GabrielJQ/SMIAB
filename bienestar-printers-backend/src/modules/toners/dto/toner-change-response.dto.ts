import { ApiProperty } from '@nestjs/swagger';

/**
 * @class TonerChangeResponseDto
 * @description Objeto de transferencia que representa la respuesta detallada de un evento de cambio de tóner.
 * Contiene información sobre el activo, el modelo de insumo utilizado y las marcas temporales del evento.
 */
export class TonerChangeResponseDto {
  /**
   * @property {number} id
   * @description Identificador único secuencial del registro de cambio en la base de datos.
   */
  @ApiProperty({ description: 'ID del registro de cambio' })
  id: number;

  /**
   * @property {string} printer_id
   * @description Identificador único (UUID o Tag) de la impresora que recibió el cambio de insumo.
   */
  @ApiProperty({ description: 'ID de la impresora (UUID)' })
  printer_id: string;

  /**
   * @property {string} toner_model
   * @description Marca comercial o modelo específico del dispositivo relacionado con el cambio.
   * Facilita la clasificación por familias de hardware (Lexmark o Kyocera).
   */
  @ApiProperty({
    description: 'Modelo de tóner utilizado',
    enum: ['lexmark', 'kyocera'],
  })
  toner_model: string;

  /**
   * @property {Date} changed_at
   * @description Fecha y hora exacta en la que se detectó mecánicamente o se reportó manualmente el cambio físico.
   */
  @ApiProperty({ description: 'Fecha real del cambio' })
  changed_at: Date;

  /**
   * @property {Date} created_at
   * @description Marca temporal de cuándo se insertó el registro en la base de datos del sistema SMIAB.
   */
  @ApiProperty({ description: 'Fecha de registro en sistema' })
  created_at: Date;

  /**
   * @constructor
   * @param {Partial<TonerChangeResponseDto>} partial - Objeto parcial para inicialización dinámica.
   */
  constructor(partial: Partial<TonerChangeResponseDto>) {
    Object.assign(this, partial);
  }
}

