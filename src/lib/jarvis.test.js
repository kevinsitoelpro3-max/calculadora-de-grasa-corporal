import { describe, expect, it, vi } from 'vitest'
import {
  URL_POR_DEFECTO,
  construirMensajes,
  guardarConfigJarvis,
  leerConfigJarvis,
  listarModelos,
  normalizarUrl,
  pedirPlanJarvis,
} from './jarvis.js'

function almacenFalso() {
  const datos = new Map()
  return {
    getItem: (k) => (datos.has(k) ? datos.get(k) : null),
    setItem: (k, v) => datos.set(k, String(v)),
  }
}

function respuesta(status, cuerpo) {
  return { ok: status >= 200 && status < 300, status, json: async () => cuerpo }
}

const resultado = {
  datos: { genero: 'hombre', edad: 30, estaturaCm: 178, pesoKg: 82.04 },
  actividad: 'moderado',
  objetivo: 'bajar',
  porcentaje: 19.456,
  categoria: { id: 'aceptable', nombre: 'Aceptable' },
  masaGrasaKg: 15.96,
  masaMagraKg: 66.08,
  imc: 25.89,
  plan: {
    mantenimiento: 2710,
    kcalObjetivo: 2168,
    macros: { proteinaG: 145, grasaG: 60, carbohidratosG: 260 },
    avisos: [],
  },
}

describe('normalizarUrl', () => {
  it('agrega http, quita barras finales y /v1', () => {
    expect(normalizarUrl('localhost:8000')).toBe('http://localhost:8000')
    expect(normalizarUrl('http://127.0.0.1:8000/')).toBe('http://127.0.0.1:8000')
    expect(normalizarUrl('https://mi-pc.local/v1/')).toBe('https://mi-pc.local')
    expect(normalizarUrl('  ')).toBe(URL_POR_DEFECTO)
  })
})

describe('configuración', () => {
  it('usa valores por defecto y recuerda lo guardado', () => {
    const s = almacenFalso()
    expect(leerConfigJarvis(s)).toEqual({ url: URL_POR_DEFECTO, modelo: '' })
    guardarConfigJarvis({ url: 'http://localhost:9000', modelo: 'qwen3:8b' }, s)
    expect(leerConfigJarvis(s)).toEqual({ url: 'http://localhost:9000', modelo: 'qwen3:8b' })
  })

  it('ignora datos corruptos o sin almacenamiento', () => {
    const s = almacenFalso()
    s.setItem('calculadora-grasa:jarvis', '{roto')
    expect(leerConfigJarvis(s).url).toBe(URL_POR_DEFECTO)
    expect(leerConfigJarvis(null).url).toBe(URL_POR_DEFECTO)
  })
})

describe('construirMensajes', () => {
  it('incluye los números calculados y el objetivo en texto', () => {
    const [sistema, usuario] = construirMensajes(resultado)
    expect(sistema.role).toBe('system')
    expect(usuario.content).toContain('"kcal_objetivo": 2168')
    expect(usuario.content).toContain('"proteina_g": 145')
    expect(usuario.content).toContain('"grasa_corporal_pct": 19.5')
    expect(usuario.content).toContain('Bajar grasa')
    expect(usuario.content).toContain('Moderado')
  })
})

describe('pedirPlanJarvis', () => {
  it('llama a /v1/chat/completions y devuelve el texto', async () => {
    const fetchFn = vi.fn(async () => respuesta(200, { choices: [{ message: { content: '  Plan listo  ' } }] }))
    const texto = await pedirPlanJarvis({
      url: 'localhost:8000/',
      apiKey: 'secreta',
      modelo: 'qwen3:8b',
      mensajes: [{ role: 'user', content: 'hola' }],
      fetchFn,
    })
    expect(texto).toBe('Plan listo')
    const [url, opciones] = fetchFn.mock.calls[0]
    expect(url).toBe('http://localhost:8000/v1/chat/completions')
    expect(opciones.method).toBe('POST')
    expect(opciones.headers.Authorization).toBe('Bearer secreta')
    expect(JSON.parse(opciones.body)).toMatchObject({ model: 'qwen3:8b', stream: false })
  })

  it('explica cómo arrancar OpenJarvis si no hay conexión', async () => {
    const fetchFn = async () => { throw new TypeError('Failed to fetch') }
    await expect(pedirPlanJarvis({ modelo: 'x', mensajes: [], fetchFn })).rejects.toThrow('jarvis serve')
  })

  it('pide la API key ante un 401 y muestra el detalle de otros errores', async () => {
    await expect(
      pedirPlanJarvis({ modelo: 'x', mensajes: [], fetchFn: async () => respuesta(401, {}) }),
    ).rejects.toThrow('API key')
    await expect(
      pedirPlanJarvis({ modelo: 'x', mensajes: [], fetchFn: async () => respuesta(400, { detail: 'Modelo inexistente' }) }),
    ).rejects.toThrow('error 400: Modelo inexistente')
  })

  it('falla si la respuesta no trae texto', async () => {
    const fetchFn = async () => respuesta(200, { choices: [] })
    await expect(pedirPlanJarvis({ modelo: 'x', mensajes: [], fetchFn })).rejects.toThrow('no devolvió texto')
  })
})

describe('listarModelos', () => {
  it('devuelve los ids de /v1/models', async () => {
    const fetchFn = vi.fn(async () => respuesta(200, { data: [{ id: 'qwen3:8b' }, { id: 'llama3.2' }] }))
    expect(await listarModelos({ url: URL_POR_DEFECTO, fetchFn })).toEqual(['qwen3:8b', 'llama3.2'])
    expect(fetchFn.mock.calls[0][0]).toBe('http://127.0.0.1:8000/v1/models')
  })
})
