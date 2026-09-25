import { describe, expect, it } from 'vitest'
import { conSigno, formatearPeso, textoDias } from './formato.js'

describe('formato', () => {
  it('muestra el signo de los cambios', () => {
    expect(conSigno(1.24)).toBe('+1.2')
    expect(conSigno(-0.86)).toBe('−0.9')
    expect(conSigno(0.04)).toBe('0.0')
    expect(conSigno(-0.04)).toBe('0.0')
  })

  it('convierte el peso según las unidades', () => {
    expect(formatearPeso(80, 'metrico')).toBe('80.0 kg')
    expect(formatearPeso(80, 'imperial')).toBe('176.4 lb')
  })

  it('describe los días transcurridos', () => {
    expect(textoDias(0)).toBe('hoy')
    expect(textoDias(1)).toBe('hace 1 día')
    expect(textoDias(14)).toBe('hace 14 días')
  })
})
