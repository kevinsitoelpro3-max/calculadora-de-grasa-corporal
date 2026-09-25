import { describe, expect, it } from 'vitest'
import { categoria, composicion, imc, porcentajeGrasaNavy } from './bodyfat.js'
import { aCm, aKg } from './units.js'

describe('porcentajeGrasaNavy', () => {
  it('calcula el % de un hombre (178 cm, cuello 38, cintura 86)', () => {
    const r = porcentajeGrasaNavy({ genero: 'hombre', estaturaCm: 178, cuelloCm: 38, cinturaCm: 86 })
    expect(r).toBeCloseTo(17.2, 1)
  })

  it('calcula el % de una mujer (165 cm, cuello 32, cintura 70, cadera 95)', () => {
    const r = porcentajeGrasaNavy({ genero: 'mujer', estaturaCm: 165, cuelloCm: 32, cinturaCm: 70, caderaCm: 95 })
    expect(r).toBeCloseTo(24.86, 1)
  })

  it('da el mismo resultado ingresando pulgadas convertidas', () => {
    const enCm = porcentajeGrasaNavy({ genero: 'hombre', estaturaCm: 178, cuelloCm: 38, cinturaCm: 86 })
    const enPulgadas = porcentajeGrasaNavy({
      genero: 'hombre',
      estaturaCm: aCm(178 / 2.54, 'imperial'),
      cuelloCm: aCm(38 / 2.54, 'imperial'),
      cinturaCm: aCm(86 / 2.54, 'imperial'),
    })
    expect(enPulgadas).toBeCloseTo(enCm, 6)
  })

  it('rechaza una cintura menor o igual al cuello', () => {
    expect(() => porcentajeGrasaNavy({ genero: 'hombre', estaturaCm: 178, cuelloCm: 40, cinturaCm: 40 })).toThrow()
  })

  it('exige la cadera para mujeres', () => {
    expect(() => porcentajeGrasaNavy({ genero: 'mujer', estaturaCm: 165, cuelloCm: 32, cinturaCm: 70 })).toThrow()
  })
})

describe('categoria', () => {
  it('usa los rangos de hombre', () => {
    expect(categoria('hombre', 4).id).toBe('esencial')
    expect(categoria('hombre', 10).id).toBe('atletico')
    expect(categoria('hombre', 17.2).id).toBe('fitness')
    expect(categoria('hombre', 18).id).toBe('aceptable')
    expect(categoria('hombre', 25).id).toBe('obesidad')
  })

  it('usa los rangos de mujer', () => {
    expect(categoria('mujer', 12).id).toBe('esencial')
    expect(categoria('mujer', 20).id).toBe('atletico')
    expect(categoria('mujer', 24.86).id).toBe('fitness')
    expect(categoria('mujer', 30).id).toBe('aceptable')
    expect(categoria('mujer', 32).id).toBe('obesidad')
  })
})

describe('otras métricas', () => {
  it('calcula el IMC', () => {
    expect(imc(80, 178)).toBeCloseTo(25.25, 2)
  })

  it('separa masa grasa y magra', () => {
    const { masaGrasaKg, masaMagraKg } = composicion({ pesoKg: 80, porcentaje: 20 })
    expect(masaGrasaKg).toBe(16)
    expect(masaMagraKg).toBe(64)
  })

  it('convierte libras a kg', () => {
    expect(aKg(176.37, 'imperial')).toBeCloseTo(80, 1)
  })
})
