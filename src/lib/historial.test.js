import { describe, expect, it } from 'vitest'
import {
  borrarHistorial,
  compararMediciones,
  guardarFormulario,
  guardarMedicion,
  leerFormulario,
  leerHistorial,
} from './historial.js'

function almacenFalso() {
  const datos = new Map()
  return {
    getItem: (k) => (datos.has(k) ? datos.get(k) : null),
    setItem: (k, v) => datos.set(k, String(v)),
    removeItem: (k) => datos.delete(k),
  }
}

function medicion(fecha, porcentaje, pesoKg = 80, genero = 'hombre') {
  const masaGrasaKg = (pesoKg * porcentaje) / 100
  return { fecha, genero, porcentaje, pesoKg, masaGrasaKg, masaMagraKg: pesoKg - masaGrasaKg }
}

describe('historial', () => {
  it('empieza vacío y guarda de la más nueva a la más vieja', () => {
    const s = almacenFalso()
    expect(leerHistorial(s)).toEqual([])
    guardarMedicion(medicion('2026-09-01T10:00:00Z', 20), s)
    guardarMedicion(medicion('2026-09-15T10:00:00Z', 19), s)
    const lista = leerHistorial(s)
    expect(lista).toHaveLength(2)
    expect(lista[0].porcentaje).toBe(19)
  })

  it('guarda como máximo 20 mediciones', () => {
    const s = almacenFalso()
    for (let i = 0; i < 25; i++) guardarMedicion(medicion(`2026-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`, 20), s)
    expect(leerHistorial(s)).toHaveLength(20)
  })

  it('borra el historial y el formulario guardado', () => {
    const s = almacenFalso()
    guardarMedicion(medicion('2026-09-01T10:00:00Z', 20), s)
    guardarFormulario({ edad: '30' }, s)
    borrarHistorial(s)
    expect(leerHistorial(s)).toEqual([])
    expect(leerFormulario(s)).toBeNull()
  })

  it('tolera datos corruptos o almacenamiento no disponible', () => {
    const s = almacenFalso()
    s.setItem('calculadora-grasa:historial', '{no es json')
    expect(leerHistorial(s)).toEqual([])
    expect(leerHistorial(null)).toEqual([])
    expect(guardarMedicion(medicion('2026-09-01T10:00:00Z', 20), null)).toHaveLength(1)
    const roto = { getItem: () => { throw new Error('bloqueado') }, setItem: () => { throw new Error('lleno') } }
    expect(leerHistorial(roto)).toEqual([])
    expect(() => guardarMedicion(medicion('2026-09-01T10:00:00Z', 20), roto)).not.toThrow()
  })

  it('recuerda los valores del formulario', () => {
    const s = almacenFalso()
    expect(leerFormulario(s)).toBeNull()
    guardarFormulario({ genero: 'mujer', edad: '28' }, s)
    expect(leerFormulario(s)).toEqual({ genero: 'mujer', edad: '28' })
  })
})

describe('compararMediciones', () => {
  it('calcula las diferencias y los días transcurridos', () => {
    const anterior = medicion('2026-09-01T10:00:00Z', 20, 82)
    const actual = medicion('2026-09-15T10:00:00Z', 18, 80)
    const c = compararMediciones(actual, anterior)
    expect(c.dias).toBe(14)
    expect(c.porcentaje).toBeCloseTo(-2, 6)
    expect(c.pesoKg).toBeCloseTo(-2, 6)
    expect(c.masaGrasaKg).toBeCloseTo(14.4 - 16.4, 6)
    expect(c.masaMagraKg).toBeCloseTo(65.6 - 65.6, 6)
  })

  it('no compara sin medición anterior o con otro género', () => {
    const actual = medicion('2026-09-15T10:00:00Z', 18)
    expect(compararMediciones(actual, undefined)).toBeNull()
    expect(compararMediciones(actual, medicion('2026-09-01T10:00:00Z', 25, 60, 'mujer'))).toBeNull()
  })
})
