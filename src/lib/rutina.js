// Rutina semanal de fuerza según objetivo, días disponibles y lugar (gimnasio o casa).

const EJERCICIOS = {
  sentadilla: { gimnasio: 'Sentadilla con barra', casa: 'Sentadilla goblet (con mochila cargada)', compuesto: true },
  bisagra: { gimnasio: 'Peso muerto rumano', casa: 'Peso muerto rumano con mochila o bidones', compuesto: true },
  zancada: { gimnasio: 'Zancadas con mancuernas', casa: 'Sentadilla búlgara con el pie en una silla', compuesto: true },
  gluteo: { gimnasio: 'Hip thrust con barra', casa: 'Puente de glúteos a una pierna', compuesto: false },
  pechoPlano: { gimnasio: 'Press de banca', casa: 'Flexiones de brazos', compuesto: true },
  pechoInclinado: { gimnasio: 'Press inclinado con mancuernas', casa: 'Flexiones con los pies elevados', compuesto: true },
  hombros: { gimnasio: 'Press militar con mancuernas', casa: 'Flexiones pica (pike push-ups)', compuesto: true },
  remo: { gimnasio: 'Remo con barra', casa: 'Remo invertido bajo una mesa firme', compuesto: true },
  jalon: { gimnasio: 'Jalón al pecho o dominadas', casa: 'Dominadas o remo con mochila', compuesto: true },
  lateral: { gimnasio: 'Elevaciones laterales', casa: 'Elevaciones laterales con botellas', compuesto: false },
  biceps: { gimnasio: 'Curl de bíceps con mancuernas', casa: 'Curl de bíceps con mochila', compuesto: false },
  triceps: { gimnasio: 'Extensión de tríceps en polea', casa: 'Fondos de tríceps en una silla', compuesto: false },
  gemelos: { gimnasio: 'Elevación de talones en máquina', casa: 'Elevación de talones en un escalón', compuesto: false },
  core: { gimnasio: 'Plancha', casa: 'Plancha', compuesto: false, tiempo: true },
}

const DIVISIONES = {
  3: [
    { nombre: 'Cuerpo completo A', ejercicios: ['sentadilla', 'pechoPlano', 'remo', 'hombros', 'core'] },
    { nombre: 'Cuerpo completo B', ejercicios: ['bisagra', 'pechoInclinado', 'jalon', 'zancada', 'biceps'] },
    { nombre: 'Cuerpo completo C', ejercicios: ['sentadilla', 'hombros', 'remo', 'gluteo', 'triceps'] },
  ],
  4: [
    { nombre: 'Torso A', ejercicios: ['pechoPlano', 'remo', 'hombros', 'jalon', 'biceps'] },
    { nombre: 'Pierna A', ejercicios: ['sentadilla', 'bisagra', 'zancada', 'gemelos', 'core'] },
    { nombre: 'Torso B', ejercicios: ['pechoInclinado', 'jalon', 'lateral', 'remo', 'triceps'] },
    { nombre: 'Pierna B', ejercicios: ['bisagra', 'gluteo', 'sentadilla', 'gemelos', 'core'] },
  ],
  5: [
    { nombre: 'Empuje', ejercicios: ['pechoPlano', 'hombros', 'pechoInclinado', 'lateral', 'triceps'] },
    { nombre: 'Tirón', ejercicios: ['jalon', 'remo', 'bisagra', 'biceps', 'core'] },
    { nombre: 'Pierna', ejercicios: ['sentadilla', 'zancada', 'gluteo', 'gemelos'] },
    { nombre: 'Torso', ejercicios: ['pechoInclinado', 'remo', 'hombros', 'jalon', 'lateral'] },
    { nombre: 'Pierna y core', ejercicios: ['bisagra', 'sentadilla', 'gluteo', 'core'] },
  ],
}

const ESQUEMAS = {
  ganar: { compuesto: [4, '6–10'], accesorio: [3, '10–15'], descanso: '2–3 min en los básicos, 60–90 s en el resto' },
  bajar: { compuesto: [3, '8–12'], accesorio: [3, '12–15'], descanso: '60–90 s' },
  mantener: { compuesto: [3, '8–12'], accesorio: [2, '10–15'], descanso: '90 s' },
}

const CARDIO = {
  bajar: 'Sumá 2–3 sesiones de 25–40 min de cardio suave (caminata rápida, bici) en días libres o después de entrenar.',
  ganar: 'Cardio suave 1–2 veces por semana, 20–30 min, para la salud del corazón sin afectar la recuperación.',
  mantener: '1–2 sesiones de cardio de 30 min por semana.',
}

export const OPCIONES_DIAS = [3, 4, 5]

export function generarRutina({ objetivo, dias = 3, lugar = 'gimnasio' }) {
  const esquema = ESQUEMAS[objetivo] ?? ESQUEMAS.mantener
  const division = DIVISIONES[dias] ?? DIVISIONES[3]

  return {
    dias: division.map((dia, i) => ({
      titulo: `Día ${i + 1}: ${dia.nombre}`,
      ejercicios: dia.ejercicios.map((id) => {
        const e = EJERCICIOS[id]
        const [series, reps] = e.compuesto ? esquema.compuesto : esquema.accesorio
        return { nombre: e[lugar], series, reps: e.tiempo ? '30–45 s' : reps }
      }),
    })),
    descanso: esquema.descanso,
    cardio: CARDIO[objetivo] ?? CARDIO.mantener,
    consejos: [
      'Dejá 1–2 repeticiones "en el tanque": terminá cada serie cerca del fallo, pero con buena técnica.',
      'Cuando llegues al tope de repeticiones en todas las series, subí el peso o la dificultad.',
      'Entre días de entrenamiento seguidos del mismo grupo muscular, dejá al menos 48 h.',
    ],
  }
}
