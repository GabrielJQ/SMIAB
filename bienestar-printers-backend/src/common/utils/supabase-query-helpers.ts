/**
 * @interface DateRangeFilter
 * @description Estructura de filtrado de tiempo aplicable a las consultas de estadísticas e historiales.
 * Soporta filtros parciales (ej. solo año) o rangos exactos (año y mes de inicio/fin).
 */
export interface DateRangeFilter {
  startYear?: number;
  startMonth?: number;
  endYear?: number;
  endMonth?: number;
}

/**
 * @function applyDateRangeFilter
 * @description Aplica un filtro de rango de fechas a un constructor de consultas (Query Builder) de Supabase
 * asumiendo que la tabla objetivo posee columnas numéricas explícitas 'year' y 'month'.
 *
 * Utiliza álgebra booleana en formato PostgREST para asegurar que la condición inicial
 * evalúe `(año > inicio) OR (año = inicio AND mes >= inicio_mes)`, y su análogo para el fin.
 * 
 * @param {any} query - Objeto de consulta de Supabase (SupabaseClient Filter Builder).
 * @param {DateRangeFilter} filters - Parámetros de rango de fecha a aplicar.
 * @returns {any} El Query Builder mutado con las condiciones de tiempo.
 */
export const applyDateRangeFilter = (query: any, filters: DateRangeFilter) => {
  let q = query;

  if (filters.startYear) {
    if (filters.startMonth) {
      // Complex filter for Start Date
      const filter = `year.gt.${filters.startYear},and(year.eq.${filters.startYear},month.gte.${filters.startMonth})`;
      q = q.or(filter);
    } else {
      // Simple filter for Start Year
      q = q.gte('year', filters.startYear);
    }
  }

  if (filters.endYear) {
    if (filters.endMonth) {
      // Complex filter for End Date
      const filter = `year.lt.${filters.endYear},and(year.eq.${filters.endYear},month.lte.${filters.endMonth})`;
      q = q.or(filter);
    } else {
      // Simple filter for End Year
      q = q.lte('year', filters.endYear);
    }
  }

  return q;
};

/**
 * @function applyTimestampRangeFilter
 * @description Filtro especializado para aplicar rangos de fecha sobre una única columna de tipo Timestamp (ej. 'changed_at').
 * Extrae y deduce el primer y último milisegundo del mes objetivo para inyectarlo en .gte() y .lte().
 * 
 * @param {any} query - Objeto de consulta de Supabase JS.
 * @param {string} column - Nombre exacto de la columna Timestamp (ej: 'changed_at', 'created_at').
 * @param {DateRangeFilter} filters - Parámetros limitantes del rango cronológico.
 * @returns {any} El Query Builder con los límites estrictos de marca temporal aplicados.
 */
export const applyTimestampRangeFilter = (
  query: any,
  column: string,
  filters: DateRangeFilter,
) => {
  let q = query;

  if (filters.startYear) {
    const startMonth = filters.startMonth || 1;
    const startDate = new Date(
      filters.startYear,
      startMonth - 1,
      1,
    ).toISOString();
    q = q.gte(column, startDate);
  }

  if (filters.endYear) {
    const endMonth = filters.endMonth || 12;
    // Last day of month logic: day 0 of next month
    const endDate = new Date(
      filters.endYear,
      endMonth,
      0,
      23,
      59,
      59,
    ).toISOString();
    q = q.lte(column, endDate);
  }

  return q;
};
