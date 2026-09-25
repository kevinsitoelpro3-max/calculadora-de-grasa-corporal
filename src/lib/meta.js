// Meta de % de grasa: cuánto hay que perder y en cuánto tiempo, conservando la masa magra.

// Ritmo de pérdida sostenible: 0,7 % del peso corporal por semana (rango habitual 0,5–1 %).
export const RITMO_SEMANAL = 0.007

// Rangos permitidos para la meta. Por debajo del mínimo no es saludable sostenerla.
export const RANGO_META = {
  hombre: { min: 8, max: 30, sugerida: 15 },
  mujer: { min: 16, max: 38, sugerida: 24 },
}

export function validarMeta(genero, meta) {
  const { min, max } = RANGO_META[genero]
  if (!Number.isFinite(meta)) return 'Escribí un número.'
  if (meta < min) return `Para ${genero === 'hombre' ? 'hombres' : 'mujeres'} no recomendamos una meta menor a ${min}%.`
  if (meta > max) return `La meta tiene que ser ${max}% o menos.`
  return null
}

// actual: { genero, pesoKg, masaMagraKg, porcentaje }
export function calcularMeta(actual, meta, hoy = new Date()) {
  const pesoMetaKg = actual.masaMagraKg / (1 - meta / 100)
  const grasaAPerderKg = actual.pesoKg - pesoMetaKg

  if (grasaAPerderKg <= 0.1) {
    return { alcanzada: true, pesoMetaKg, grasaAPerderKg: 0, semanas: 0, fechaEstimada: null }
  }

  // Cada semana se pierde el 0,7 % del peso de ese momento, así que el ritmo baja a medida que avanzás.
  const semanas = Math.ceil(Math.log(pesoMetaKg / actual.pesoKg) / Math.log(1 - RITMO_SEMANAL))
  const fechaEstimada = new Date(hoy.getTime() + semanas * 7 * 24 * 60 * 60 * 1000)
  return {
    alcanzada: false,
    pesoMetaKg,
    grasaAPerderKg,
    semanas,
    perdidaSemanalKg: actual.pesoKg * RITMO_SEMANAL,
    fechaEstimada: fechaEstimada.toISOString(),
  }
}

// Qué parte del camino ya recorriste, entre la primera medición y la meta (0 a 1).
export function progresoHaciaMeta(inicial, actual, meta) {
  const total = inicial - meta
  if (total <= 0) return actual <= meta ? 1 : 0
  return Math.min(Math.max((inicial - actual) / total, 0), 1)
}
