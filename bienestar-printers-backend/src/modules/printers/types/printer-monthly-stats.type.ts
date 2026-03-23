/**
 * @interface PrinterMonthlyStats
 * @description Representa las métricas de consumo calculadas (Deltas) para una impresora en un mes específico.
 * Estos datos son el resultado de restar la lectura actual menos la anterior, reflejando el uso real del periodo.
 */
export interface PrinterMonthlyStats {
  /** @property {string} id - UUID único del registro de estadística. */
  id: string;
  /** @property {string} asset_id - Relación con el activo (impresora). */
  asset_id: string;
  /** @property {number} year - Año de la métrica. */
  year: number;
  /** @property {number} month - Mes de la métrica (1-12). */
  month: number;
  /** @property {number} print_only_delta - Páginas impresas exclusivamente en modo impresora. */
  print_only_delta: number;
  /** @property {number} copy_delta - Páginas generadas mediante el uso de copiado físico. */
  copy_delta: number;
  /** @property {number} print_total_delta - Suma total de actividad (Impresiones + Copias). */
  print_total_delta: number;

  /** @property {string} created_at - Fecha de registro en la base de datos. */
  created_at: string;
}

