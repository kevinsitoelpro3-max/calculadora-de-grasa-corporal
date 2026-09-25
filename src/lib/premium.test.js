import { describe, expect, it } from 'vitest'
import { calcularMeta, progresoHaciaMeta, validarMeta } from './meta.js'
import { COMIDAS, generarMenu } from './menu.js'
import { generarRutina } from './rutina.js'
import { generarPlan } from './plan.js'

describe('meta', () => {
  const actual = { genero: 'hombre', pesoKg: 80, masaMagraKg: 64, porcentaje: 20 }

  it('calcula el peso meta conservando la masa magra', () => {
    const r = calcularMeta(actual, 15, new Date('2026-01-01T00:00:00Z'))
    expect(r.pesoMetaKg).toBeCloseTo(64 / 0.85, 5) // 75.29 kg
    expect(r.grasaAPerderKg).toBeCloseTo(80 - 64 / 0.85, 5)
    // ln(75.29/80)/ln(0.993) ≈ 8.6 → 9 semanas
    expect(r.semanas).toBe(9)
    expect(r.fechaEstimada.slice(0, 10)).toBe('2026-03-05')
  })

  it('marca la meta como alcanzada si ya estás por debajo', () => {
    expect(calcularMeta(actual, 22).alcanzada).toBe(true)
  })

  it('valida rangos saludables por género', () => {
    expect(validarMeta('hombre', 5)).toMatch(/menor a 8/)
    expect(validarMeta('mujer', 14)).toMatch(/menor a 16/)
    expect(validarMeta('mujer', 45)).toMatch(/38/)
    expect(validarMeta('hombre', 12)).toBeNull()
  })

  it('mide el progreso entre la primera medición y la meta', () => {
    expect(progresoHaciaMeta(25, 20, 15)).toBeCloseTo(0.5, 5)
    expect(progresoHaciaMeta(25, 26, 15)).toBe(0)
    expect(progresoHaciaMeta(25, 14, 15)).toBe(1)
    expect(progresoHaciaMeta(15, 14, 15)).toBe(1)
  })
})

describe('menú', () => {
  const casos = [
    { genero: 'hombre', edad: 30, pesoKg: 80, estaturaCm: 178, masaMagraKg: 66, categoriaId: 'fitness', objetivo: 'bajar', actividad: 'moderado' },
    { genero: 'hombre', edad: 25, pesoKg: 70, estaturaCm: 175, masaMagraKg: 61, categoriaId: 'atletico', objetivo: 'ganar', actividad: 'alto' },
    { genero: 'mujer', edad: 28, pesoKg: 60, estaturaCm: 165, masaMagraKg: 45, categoriaId: 'fitness', objetivo: 'bajar', actividad: 'ligero' },
    { genero: 'mujer', edad: 45, pesoKg: 90, estaturaCm: 160, masaMagraKg: 52, categoriaId: 'obesidad', objetivo: 'bajar', actividad: 'sedentario' },
  ]

  // La proteína puede pasarse un poco (legumbres, lácteos), pero nunca quedar corta.
  it('cada combinación de opciones se acerca a las calorías y proteína del plan, con porciones realistas', () => {
    for (const datos of casos) {
      const plan = generarPlan(datos)
      const maxOpciones = Math.max(...COMIDAS.map((c) => c.opciones.length))
      for (let i = 0; i < maxOpciones; i++) {
        const elecciones = Object.fromEntries(COMIDAS.map((c) => [c.id, i]))
        const menu = generarMenu(plan.macros, elecciones)
        expect(Math.abs(menu.kcal - plan.kcalObjetivo) / plan.kcalObjetivo).toBeLessThan(0.12)
        const desvioProteina = (menu.total.proteinaG - plan.macros.proteinaG) / plan.macros.proteinaG
        expect(desvioProteina).toBeGreaterThan(-0.1)
        expect(desvioProteina).toBeLessThan(0.3)
        for (const c of menu.comidas) for (const item of c.items) expect(item.gramos).toBeLessThanOrEqual(400)
      }
    }
  })

  it('arma 4 comidas con porciones redondeadas y huevos en unidades enteras', () => {
    const menu = generarMenu({ proteinaG: 150, grasaG: 60, carbohidratosG: 200 })
    expect(menu.comidas.map((c) => c.id)).toEqual(['desayuno', 'almuerzo', 'merienda', 'cena'])
    const desayuno = menu.comidas[0]
    expect(desayuno.items[0].texto).toMatch(/^\d+ huevos? \(\d+ g\)$/)
    for (const c of menu.comidas) for (const item of c.items) expect(item.gramos % 5).toBe(0)
  })

  it('rota las opciones de cada comida', () => {
    const a = generarMenu({ proteinaG: 150, grasaG: 60, carbohidratosG: 200 }, { almuerzo: 0 })
    const b = generarMenu({ proteinaG: 150, grasaG: 60, carbohidratosG: 200 }, { almuerzo: 1 })
    expect(a.comidas[1].items[0].texto).not.toBe(b.comidas[1].items[0].texto)
    const vuelta = generarMenu({ proteinaG: 150, grasaG: 60, carbohidratosG: 200 }, { almuerzo: 4 })
    expect(vuelta.comidas[1].indice).toBe(0)
  })
})

describe('rutina', () => {
  it('genera tantos días como se piden', () => {
    for (const dias of [3, 4, 5]) expect(generarRutina({ objetivo: 'bajar', dias }).dias).toHaveLength(dias)
  })

  it('usa ejercicios de casa o de gimnasio', () => {
    const gym = generarRutina({ objetivo: 'ganar', dias: 3, lugar: 'gimnasio' })
    const casa = generarRutina({ objetivo: 'ganar', dias: 3, lugar: 'casa' })
    expect(gym.dias[0].ejercicios[1].nombre).toBe('Press de banca')
    expect(casa.dias[0].ejercicios[1].nombre).toBe('Flexiones de brazos')
  })

  it('ajusta series y repeticiones al objetivo', () => {
    const ganar = generarRutina({ objetivo: 'ganar', dias: 3 }).dias[0].ejercicios[0]
    const bajar = generarRutina({ objetivo: 'bajar', dias: 3 }).dias[0].ejercicios[0]
    expect(ganar).toMatchObject({ series: 4, reps: '6–10' })
    expect(bajar).toMatchObject({ series: 3, reps: '8–12' })
    const plancha = generarRutina({ objetivo: 'bajar', dias: 3 }).dias[0].ejercicios.at(-1)
    expect(plancha.reps).toBe('30–45 s')
  })
})

describe('meta sugerida y meta de músculo', async () => {
  const { metaSugerida, tipoMetaSugerido, calcularMetaMusculo, validarMetaMusculo } = await import('./meta.js')

  it('sugiere 3 puntos menos que hoy, dentro del rango saludable', () => {
    expect(metaSugerida('hombre', 17.2)).toBe(14)
    expect(metaSugerida('hombre', 6.9)).toBe(8)
    expect(metaSugerida('mujer', 17.3)).toBe(16)
    expect(metaSugerida('hombre', 40)).toBe(30)
  })

  it('elige meta de músculo si el objetivo es ganar o si ya estás muy magro', () => {
    expect(tipoMetaSugerido('hombre', 17, 'ganar')).toBe('musculo')
    expect(tipoMetaSugerido('hombre', 8.5, 'bajar')).toBe('musculo')
    expect(tipoMetaSugerido('mujer', 17.3, 'mantener')).toBe('musculo')
    expect(tipoMetaSugerido('mujer', 25, 'bajar')).toBe('grasa')
  })

  it('calcula tiempo, peso final y progreso de la meta de músculo', () => {
    const r = calcularMetaMusculo(
      { inicialMagraKg: 60, actual: { masaMagraKg: 61, porcentaje: 10 } },
      3,
      new Date('2026-01-01T00:00:00Z'),
    )
    expect(r.objetivoMagraKg).toBe(63)
    expect(r.faltaKg).toBeCloseTo(2, 6)
    expect(r.semanas).toBe(Math.ceil((2 / 0.5) * (52 / 12))) // 18 semanas
    expect(r.pesoFinalKg).toBeCloseTo(70, 6)
    expect(r.progreso).toBeCloseTo(1 / 3, 6)
    expect(calcularMetaMusculo({ inicialMagraKg: 60, actual: { masaMagraKg: 64, porcentaje: 10 } }, 3).alcanzada).toBe(true)
  })

  it('valida la cantidad de músculo', () => {
    expect(validarMetaMusculo(0.2)).toMatch(/al menos/)
    expect(validarMetaMusculo(20)).toMatch(/15 kg/)
    expect(validarMetaMusculo(3)).toBeNull()
  })
})

describe('resolverMeta', async () => {
  const { resolverMeta } = await import('./meta.js')
  it('completa con sugerencias y acepta el formato viejo (número)', () => {
    expect(resolverMeta(undefined, { genero: 'hombre', porcentaje: 17.2, objetivo: 'bajar' })).toEqual({ tipo: 'grasa', grasa: 14, musculoKg: 3 })
    expect(resolverMeta(12, { genero: 'hombre', porcentaje: 17.2, objetivo: 'bajar' })).toMatchObject({ grasa: 12 })
    expect(resolverMeta({ tipo: 'musculo', musculoKg: 5 }, { genero: 'mujer', porcentaje: 30, objetivo: 'bajar' })).toEqual({ tipo: 'musculo', grasa: 27, musculoKg: 5 })
  })
})
