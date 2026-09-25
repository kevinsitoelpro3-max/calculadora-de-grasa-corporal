import { describe, expect, it } from 'vitest'
import {
  aFila,
  borrarMedicionesNube,
  deFila,
  emailValido,
  enviarEnlace,
  guardarMedicionNube,
  leerMedicionesNube,
  subirMedicionesLocales,
} from './nube.js'

const medicion = {
  fecha: '2026-09-25T10:00:00.000Z',
  genero: 'mujer',
  porcentaje: 24.8612,
  pesoKg: 60.456,
  masaGrasaKg: 15.0301,
  masaMagraKg: 45.4259,
}

// Cliente falso que registra las llamadas y devuelve lo que le indiquemos.
function clienteFalso(respuesta = { data: [], error: null }) {
  const llamadas = []
  const consulta = new Proxy(
    {},
    {
      get(_, metodo) {
        if (metodo === 'then') return (ok, mal) => Promise.resolve(respuesta).then(ok, mal)
        return (...args) => {
          llamadas.push([metodo, ...args])
          return consulta
        }
      },
    },
  )
  return {
    llamadas,
    from: (tabla) => {
      llamadas.push(['from', tabla])
      return consulta
    },
    auth: {
      signInWithOtp: async (args) => {
        llamadas.push(['signInWithOtp', args])
        return respuesta
      },
    },
  }
}

describe('conversión de filas', () => {
  it('ida y vuelta conserva los datos (redondeados a 2 decimales)', () => {
    const fila = aFila(medicion, 'usuario-1')
    expect(fila).toMatchObject({ user_id: 'usuario-1', porcentaje: 24.86, peso_kg: 60.46, masa_grasa_kg: 15.03 })
    const vuelta = deFila({ ...fila, porcentaje: '24.86', peso_kg: '60.46' })
    expect(vuelta.porcentaje).toBe(24.86)
    expect(vuelta.pesoKg).toBe(60.46)
    expect(vuelta.fecha).toBe(medicion.fecha)
  })
})

describe('operaciones con Supabase', () => {
  it('lee las mediciones ordenadas de la más nueva a la más vieja', async () => {
    const c = clienteFalso({ data: [aFila(medicion, 'u')], error: null })
    const lista = await leerMedicionesNube(c)
    expect(lista).toHaveLength(1)
    expect(c.llamadas).toContainEqual(['order', 'fecha', { ascending: false }])
  })

  it('guarda una medición con el usuario', async () => {
    const c = clienteFalso({ data: null, error: null })
    await guardarMedicionNube(c, medicion, 'u')
    expect(c.llamadas).toContainEqual(['insert', aFila(medicion, 'u')])
  })

  it('sube el historial local ignorando duplicados, y no llama si está vacío', async () => {
    const c = clienteFalso({ data: null, error: null })
    await subirMedicionesLocales(c, [medicion], 'u')
    expect(c.llamadas).toContainEqual(['upsert', [aFila(medicion, 'u')], { onConflict: 'user_id,fecha', ignoreDuplicates: true }])
    const vacio = clienteFalso()
    await subirMedicionesLocales(vacio, [], 'u')
    expect(vacio.llamadas).toEqual([])
  })

  it('borra solo las mediciones del usuario', async () => {
    const c = clienteFalso({ data: null, error: null })
    await borrarMedicionesNube(c, 'u')
    expect(c.llamadas).toContainEqual(['eq', 'user_id', 'u'])
  })

  it('envía el enlace mágico con la dirección de regreso', async () => {
    const c = clienteFalso({ data: {}, error: null })
    await enviarEnlace(c, 'ana@ejemplo.com', 'https://app.vercel.app')
    expect(c.llamadas[0][1]).toEqual({ email: 'ana@ejemplo.com', options: { emailRedirectTo: 'https://app.vercel.app' } })
  })

  it('convierte los errores de Supabase en excepciones', async () => {
    const c = clienteFalso({ data: null, error: { message: 'sin permiso' } })
    await expect(leerMedicionesNube(c)).rejects.toThrow('sin permiso')
  })
})

describe('emailValido', () => {
  it('acepta emails comunes y rechaza texto inválido', () => {
    expect(emailValido('ana@ejemplo.com')).toBe(true)
    expect(emailValido(' ana@ejemplo.com ')).toBe(true)
    expect(emailValido('ana@')).toBe(false)
    expect(emailValido('ana ejemplo.com')).toBe(false)
  })
})
