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

// Meta sugerida para empezar: unos 3 puntos menos que hoy, dentro del rango saludable.
export function metaSugerida(genero, porcentajeActual) {
  const { min, max } = RANGO_META[genero]
  return Math.min(Math.max(Math.round(porcentajeActual - 3), min), max)
}

// Si ya estás en el mínimo saludable (o querés ganar músculo), la meta que tiene sentido es de músculo.
export function tipoMetaSugerido(genero, porcentajeActual, objetivo) {
  if (objetivo === 'ganar') return 'musculo'
  return porcentajeActual <= RANGO_META[genero].min + 2 ? 'musculo' : 'grasa'
}

// Ganancia de músculo realista para alguien que entrena bien: unos 0,5 kg por mes.
export const MUSCULO_MENSUAL_KG = 0.5
export const RANGO_MUSCULO = { min: 0.5, max: 15, sugerida: 3 }

export function validarMetaMusculo(kg) {
  if (!Number.isFinite(kg)) return 'Escribí un número.'
  if (kg < RANGO_MUSCULO.min) return `La meta tiene que ser de al menos ${RANGO_MUSCULO.min} kg.`
  if (kg > RANGO_MUSCULO.max) return `Poné una meta de ${RANGO_MUSCULO.max} kg o menos: más que eso lleva años.`
  return null
}

// La meta de músculo se mide desde la primera medición: masa magra inicial + kg a ganar.
// actual: { masaMagraKg, porcentaje }
export function calcularMetaMusculo({ inicialMagraKg, actual }, kgAGanar, hoy = new Date()) {
  const objetivoMagraKg = inicialMagraKg + kgAGanar
  const faltaKg = objetivoMagraKg - actual.masaMagraKg
  const ganadoKg = actual.masaMagraKg - inicialMagraKg
  const progreso = Math.min(Math.max(ganadoKg / kgAGanar, 0), 1)
  // Peso final si ganás ese músculo manteniendo tu % de grasa actual.
  const pesoFinalKg = objetivoMagraKg / (1 - actual.porcentaje / 100)

  if (faltaKg <= 0.05) {
    return { alcanzada: true, objetivoMagraKg, faltaKg: 0, semanas: 0, fechaEstimada: null, pesoFinalKg, progreso: 1 }
  }
  const semanas = Math.ceil((faltaKg / MUSCULO_MENSUAL_KG) * (52 / 12))
  return {
    alcanzada: false,
    objetivoMagraKg,
    faltaKg,
    semanas,
    fechaEstimada: new Date(hoy.getTime() + semanas * 7 * 24 * 60 * 60 * 1000).toISOString(),
    pesoFinalKg,
    progreso,
  }
}

// Completa la meta guardada con los valores sugeridos. `guardada` puede venir de versiones
// anteriores como un número (meta de % de grasa).
export function resolverMeta(guardada, { genero, porcentaje, objetivo }) {
  const datos = typeof guardada === 'number' ? { grasa: guardada } : guardada ?? {}
  return {
    tipo: datos.tipo ?? tipoMetaSugerido(genero, porcentaje, objetivo),
    grasa: datos.grasa ?? metaSugerida(genero, porcentaje),
    musculoKg: datos.musculoKg ?? RANGO_MUSCULO.sugerida,
  }
}
