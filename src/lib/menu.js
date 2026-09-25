// Menú de ejemplo que reparte las calorías y macros del plan en 4 comidas, con porciones en gramos.
// Valores nutricionales aproximados por 100 g (proteína, carbohidratos, grasas).

const ALIMENTOS = {
  pollo: { nombre: 'Pechuga de pollo cocida', p: 31, c: 0, g: 3.6 },
  carne: { nombre: 'Carne magra cocida', p: 27, c: 0, g: 10 },
  atun: { nombre: 'Atún al natural', p: 26, c: 0, g: 1 },
  huevo: { nombre: 'Huevo', p: 13, c: 1.1, g: 10, unidadG: 50, unidad: ['huevo', 'huevos'] },
  yogur: { nombre: 'Yogur griego natural descremado', p: 10, c: 4, g: 0.4 },
  tofu: { nombre: 'Tofu firme', p: 15, c: 3, g: 8 },
  arroz: { nombre: 'Arroz cocido', p: 2.7, c: 28, g: 0.3, max: 300 },
  papa: { nombre: 'Papa hervida', p: 2, c: 17, g: 0.1, max: 400 },
  fideos: { nombre: 'Fideos cocidos', p: 5.8, c: 31, g: 0.9, max: 300 },
  lentejas: { nombre: 'Lentejas cocidas', p: 9, c: 20, g: 0.4, max: 250 },
  avena: { nombre: 'Avena', p: 13, c: 66, g: 7, max: 100 },
  pan: { nombre: 'Pan integral', p: 13, c: 41, g: 3.4, max: 120 },
  banana: { nombre: 'Banana', p: 1.1, c: 23, g: 0.3, max: 240 },
  aceite: { nombre: 'Aceite de oliva', p: 0, c: 0, g: 100 },
  palta: { nombre: 'Palta', p: 2, c: 9, g: 15 },
  mani: { nombre: 'Mantequilla de maní', p: 25, c: 20, g: 50 },
}

// Parte de las calorías del día que va a cada comida y opciones intercambiables.
export const COMIDAS = [
  {
    id: 'desayuno',
    nombre: 'Desayuno',
    parte: 0.25,
    opciones: [
      { proteina: 'huevo', carbo: 'pan', grasa: 'palta', libre: 'Café o té sin azúcar' },
      { proteina: 'yogur', carbo: 'avena', grasa: 'mani', libre: 'Frutos rojos o canela' },
    ],
  },
  {
    id: 'almuerzo',
    nombre: 'Almuerzo',
    parte: 0.35,
    opciones: [
      { proteina: 'pollo', carbo: 'arroz', grasa: 'aceite', libre: 'Ensalada o verduras libres' },
      { proteina: 'carne', carbo: 'papa', grasa: 'aceite', libre: 'Verduras al horno libres' },
      { proteina: 'atun', carbo: 'fideos', grasa: 'aceite', libre: 'Tomate y verduras libres' },
      { proteina: 'tofu', carbo: 'lentejas', grasa: 'aceite', libre: 'Verduras salteadas libres' },
    ],
  },
  {
    id: 'merienda',
    nombre: 'Merienda',
    parte: 0.15,
    opciones: [
      { proteina: 'yogur', carbo: 'banana', grasa: 'mani', libre: null },
      { proteina: 'huevo', carbo: 'pan', grasa: 'palta', libre: null },
    ],
  },
  {
    id: 'cena',
    nombre: 'Cena',
    parte: 0.25,
    opciones: [
      { proteina: 'pollo', carbo: 'papa', grasa: 'aceite', libre: 'Verduras libres' },
      { proteina: 'atun', carbo: 'arroz', grasa: 'palta', libre: 'Ensalada libre' },
      { proteina: 'carne', carbo: 'lentejas', grasa: 'aceite', libre: 'Verduras libres' },
    ],
  },
]

const porGramo = (alimento, macro) => alimento[macro] / 100

function redondearPorcion(gramos, alimento) {
  if (alimento.unidadG) return Math.max(Math.round(gramos / alimento.unidadG), 1) * alimento.unidadG
  const paso = alimento.g >= 90 ? 5 : 10 // el aceite se mide más fino
  return Math.round(gramos / paso) * paso
}

function macrosDe(items) {
  return items.reduce(
    (t, { alimento, gramos }) => ({
      proteinaG: t.proteinaG + gramos * porGramo(alimento, 'p'),
      carbohidratosG: t.carbohidratosG + gramos * porGramo(alimento, 'c'),
      grasaG: t.grasaG + gramos * porGramo(alimento, 'g'),
    }),
    { proteinaG: 0, carbohidratosG: 0, grasaG: 0 },
  )
}

const kcalDe = (m) => m.proteinaG * 4 + m.carbohidratosG * 4 + m.grasaG * 9

// Reparte los carbohidratos: primero el alimento principal hasta su porción máxima, y lo que
// falta se completa con fruta y después pan, para no terminar con porciones irreales.
function porcionesDeCarbo(idPrincipal, carbohidratosG) {
  const cadena = [idPrincipal, 'banana', 'pan'].filter((id, i, lista) => lista.indexOf(id) === i)
  const items = []
  let falta = carbohidratosG
  for (const [i, id] of cadena.entries()) {
    if (falta <= 5) break
    const alimento = ALIMENTOS[id]
    const esUltimo = i === cadena.length - 1
    const gramos = redondearPorcion(Math.min(falta / porGramo(alimento, 'c'), esUltimo ? Infinity : alimento.max), alimento)
    if (gramos <= 0) continue
    items.push({ alimento, gramos })
    falta -= gramos * porGramo(alimento, 'c')
  }
  return items
}

// Calcula las porciones de una comida para acercarse a sus macros objetivo:
// primero los carbohidratos, después la proteína que falta y al final la grasa que falta.
export function armarComida(opcion, objetivo) {
  const proteina = ALIMENTOS[opcion.proteina]
  const grasa = ALIMENTOS[opcion.grasa]

  const carbos = porcionesDeCarbo(opcion.carbo, objetivo.carbohidratosG)
  const deCarbos = macrosDe(carbos)
  const faltaProteina = objetivo.proteinaG - deCarbos.proteinaG
  const gProteina = redondearPorcion(Math.max(faltaProteina, 0) / porGramo(proteina, 'p'), proteina)
  const faltaGrasa = objetivo.grasaG - deCarbos.grasaG - gProteina * porGramo(proteina, 'g')
  const gGrasa = redondearPorcion(Math.max(faltaGrasa, 0) / porGramo(grasa, 'g'), grasa)

  const items = [
    { alimento: proteina, gramos: gProteina },
    ...carbos,
    { alimento: grasa, gramos: gGrasa },
  ].filter((i) => i.gramos > 0)

  const macros = macrosDe(items)
  return {
    items: items.map(({ alimento, gramos }) => ({ texto: describir(alimento, gramos), gramos })),
    libre: opcion.libre,
    macros,
    kcal: kcalDe(macros),
  }
}

function describir(alimento, gramos) {
  if (alimento.unidadG) {
    const n = gramos / alimento.unidadG
    return `${n} ${alimento.unidad[n === 1 ? 0 : 1]} (${gramos} g)`
  }
  return `${alimento.nombre}: ${gramos} g`
}

// macros: { proteinaG, grasaG, carbohidratosG } del día. elecciones: { desayuno: 0, almuerzo: 1, ... }
export function generarMenu(macros, elecciones = {}) {
  const comidas = COMIDAS.map((comida) => {
    const indice = (elecciones[comida.id] ?? 0) % comida.opciones.length
    const objetivo = {
      proteinaG: macros.proteinaG * comida.parte,
      carbohidratosG: macros.carbohidratosG * comida.parte,
      grasaG: macros.grasaG * comida.parte,
    }
    return { id: comida.id, nombre: comida.nombre, indice, cantidadOpciones: comida.opciones.length, ...armarComida(comida.opciones[indice], objetivo) }
  })
  const total = comidas.reduce(
    (t, c) => ({
      proteinaG: t.proteinaG + c.macros.proteinaG,
      carbohidratosG: t.carbohidratosG + c.macros.carbohidratosG,
      grasaG: t.grasaG + c.macros.grasaG,
    }),
    { proteinaG: 0, carbohidratosG: 0, grasaG: 0 },
  )
  return { comidas, total, kcal: kcalDe(total) }
}
