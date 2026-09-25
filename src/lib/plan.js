// Plan básico basado en reglas simples (sin IA).
// Está aislado de la interfaz para poder reemplazarlo más adelante por un plan generado con IA.

export const NIVELES_ACTIVIDAD = [
  { id: 'sedentario', nombre: 'Sedentario (poco o nada de ejercicio)', factor: 1.2 },
  { id: 'ligero', nombre: 'Ligero (1–3 días por semana)', factor: 1.375 },
  { id: 'moderado', nombre: 'Moderado (3–5 días por semana)', factor: 1.55 },
  { id: 'alto', nombre: 'Alto (6–7 días por semana)', factor: 1.725 },
  { id: 'muy_alto', nombre: 'Muy alto (trabajo físico o doble turno)', factor: 1.9 },
]

export const OBJETIVOS = [
  { id: 'bajar', nombre: 'Bajar grasa' },
  { id: 'ganar', nombre: 'Ganar músculo' },
  { id: 'mantener', nombre: 'Mantener' },
]

const KCAL_POR_GRAMO = { proteina: 4, carbohidratos: 4, grasa: 9 }
const MINIMO_KCAL = { hombre: 1500, mujer: 1200 }

// Metabolismo basal con la ecuación de Mifflin-St Jeor.
export function metabolismoBasal({ genero, pesoKg, estaturaCm, edad }) {
  const base = 10 * pesoKg + 6.25 * estaturaCm - 5 * edad
  return genero === 'hombre' ? base + 5 : base - 161
}

export function caloriasMantenimiento(datos, actividadId) {
  const nivel = NIVELES_ACTIVIDAD.find((n) => n.id === actividadId) ?? NIVELES_ACTIVIDAD[0]
  return metabolismoBasal(datos) * nivel.factor
}

function ajusteCalorico(objetivo, categoriaId) {
  if (objetivo === 'bajar') {
    if (categoriaId === 'obesidad') return -0.25
    if (categoriaId === 'atletico') return -0.1
    return -0.2
  }
  if (objetivo === 'ganar') {
    return categoriaId === 'atletico' || categoriaId === 'esencial' ? 0.1 : 0.05
  }
  return 0
}

function entrenamiento(objetivo) {
  if (objetivo === 'bajar') {
    return {
      frecuencia: '3–4 días de fuerza + 2–3 sesiones de cardio suave por semana',
      rutina: 'Cuerpo completo o torso/pierna, con pesas o peso corporal, para conservar el músculo mientras bajás grasa.',
      extras: ['Caminá 8.000–10.000 pasos por día.', 'Dormí 7–9 horas: el mal descanso aumenta el hambre.'],
    }
  }
  if (objetivo === 'ganar') {
    return {
      frecuencia: '4–5 días de fuerza por semana',
      rutina: 'Torso/pierna o empuje/tirón/pierna, 10–20 series por grupo muscular por semana, entre 6 y 12 repeticiones.',
      extras: ['Aplicá sobrecarga progresiva: subí peso o repeticiones cada semana.', 'Cardio suave 1–2 veces por semana para la salud del corazón.'],
    }
  }
  return {
    frecuencia: '3–4 días de fuerza + 1–2 sesiones de cardio por semana',
    rutina: 'Cuerpo completo o torso/pierna, manteniendo los pesos que ya manejás.',
    extras: ['Mantené una actividad diaria constante (7.000+ pasos).'],
  }
}

function avisos({ objetivo, genero, categoriaId, kcalObjetivo, kcalSinLimite }) {
  const lista = []
  if (objetivo === 'bajar' && categoriaId === 'esencial') {
    lista.push('Tu grasa corporal ya está en el nivel esencial. No se recomienda bajarla más: consultá con un profesional.')
  }
  if (objetivo === 'ganar' && categoriaId === 'obesidad') {
    lista.push('Con tu % de grasa actual conviene priorizar bajar grasa (o recomposición: comer en mantenimiento y entrenar fuerza) antes de un superávit.')
  }
  if (kcalObjetivo > kcalSinLimite) {
    lista.push(`Se ajustaron las calorías al mínimo recomendado (${MINIMO_KCAL[genero]} kcal) para evitar un déficit excesivo.`)
  }
  return lista
}

export function generarPlan({ genero, edad, pesoKg, estaturaCm, masaMagraKg, categoriaId, objetivo, actividad }) {
  const mantenimiento = caloriasMantenimiento({ genero, pesoKg, estaturaCm, edad }, actividad)
  const ajuste = ajusteCalorico(objetivo, categoriaId)
  const kcalSinLimite = mantenimiento * (1 + ajuste)
  const kcalObjetivo = Math.max(kcalSinLimite, MINIMO_KCAL[genero])

  // Proteína según la masa magra, para que el cálculo sea razonable también con mucho % de grasa.
  const proteinaG = masaMagraKg * (objetivo === 'mantener' ? 2.0 : 2.2)
  const grasaG = Math.max((kcalObjetivo * 0.25) / KCAL_POR_GRAMO.grasa, pesoKg * 0.6)
  const kcalRestantes = kcalObjetivo - proteinaG * KCAL_POR_GRAMO.proteina - grasaG * KCAL_POR_GRAMO.grasa
  const carbohidratosG = Math.max(kcalRestantes / KCAL_POR_GRAMO.carbohidratos, 0)

  return {
    mantenimiento: Math.round(mantenimiento),
    kcalObjetivo: Math.round(kcalObjetivo),
    ajustePorcentaje: Math.round(ajuste * 100),
    macros: {
      proteinaG: Math.round(proteinaG),
      grasaG: Math.round(grasaG),
      carbohidratosG: Math.round(carbohidratosG),
    },
    entrenamiento: entrenamiento(objetivo),
    avisos: avisos({ objetivo, genero, categoriaId, kcalObjetivo, kcalSinLimite }),
  }
}
