import { describe, expect, it } from 'vitest'
import { generarPlan, metabolismoBasal } from './plan.js'
import { validarFormulario } from './validation.js'

const hombre = { genero: 'hombre', edad: 30, pesoKg: 80, estaturaCm: 178, masaMagraKg: 66 }

describe('metabolismoBasal (Mifflin-St Jeor)', () => {
  it('calcula hombres', () => {
    // 10·80 + 6.25·178 − 5·30 + 5 = 1767.5
    expect(metabolismoBasal(hombre)).toBeCloseTo(1767.5, 5)
  })

  it('calcula mujeres', () => {
    // 10·60 + 6.25·165 − 5·28 − 161 = 1330.25
    expect(metabolismoBasal({ genero: 'mujer', pesoKg: 60, estaturaCm: 165, edad: 28 })).toBeCloseTo(1330.25, 5)
  })
})

describe('generarPlan', () => {
  it('aplica un déficit del 20 % para bajar grasa', () => {
    const plan = generarPlan({ ...hombre, categoriaId: 'fitness', objetivo: 'bajar', actividad: 'moderado' })
    expect(plan.mantenimiento).toBe(Math.round(1767.5 * 1.55))
    expect(plan.kcalObjetivo).toBe(Math.round(1767.5 * 1.55 * 0.8))
    expect(plan.ajustePorcentaje).toBe(-20)
  })

  it('los macros suman aproximadamente las calorías objetivo', () => {
    const plan = generarPlan({ ...hombre, categoriaId: 'aceptable', objetivo: 'ganar', actividad: 'ligero' })
    const { proteinaG, grasaG, carbohidratosG } = plan.macros
    const kcal = proteinaG * 4 + grasaG * 9 + carbohidratosG * 4
    expect(Math.abs(kcal - plan.kcalObjetivo)).toBeLessThan(15)
  })

  it('no baja de las calorías mínimas', () => {
    const plan = generarPlan({
      genero: 'mujer', edad: 60, pesoKg: 45, estaturaCm: 150, masaMagraKg: 33,
      categoriaId: 'obesidad', objetivo: 'bajar', actividad: 'sedentario',
    })
    expect(plan.kcalObjetivo).toBe(1200)
    expect(plan.avisos.length).toBeGreaterThan(0)
  })

  it('avisa si quiere ganar músculo con obesidad', () => {
    const plan = generarPlan({ ...hombre, categoriaId: 'obesidad', objetivo: 'ganar', actividad: 'moderado' })
    expect(plan.avisos.some((a) => a.includes('bajar grasa'))).toBe(true)
  })
})

describe('validarFormulario', () => {
  const base = { genero: 'hombre', sistema: 'metrico', edad: '30', estatura: '178', peso: '80', cuello: '38', cintura: '86', cadera: '' }

  it('acepta datos válidos y acepta coma decimal', () => {
    const { datos, errores } = validarFormulario({ ...base, peso: '80,5' })
    expect(errores).toEqual({})
    expect(datos.pesoKg).toBe(80.5)
  })

  it('marca campos vacíos y fuera de rango', () => {
    const { datos, errores } = validarFormulario({ ...base, edad: '', estatura: '17.8' })
    expect(datos).toBeNull()
    expect(errores.edad).toBeDefined()
    expect(errores.estatura).toBeDefined()
  })

  it('exige cadera sólo a mujeres', () => {
    expect(validarFormulario({ ...base, genero: 'mujer' }).errores.cadera).toBeDefined()
    expect(validarFormulario(base).errores.cadera).toBeUndefined()
  })

  it('convierte unidades imperiales', () => {
    const { datos } = validarFormulario({ ...base, sistema: 'imperial', estatura: '70', peso: '176', cuello: '15', cintura: '34' })
    expect(datos.estaturaCm).toBeCloseTo(177.8, 5)
    expect(datos.pesoKg).toBeCloseTo(79.83, 2)
  })
})
