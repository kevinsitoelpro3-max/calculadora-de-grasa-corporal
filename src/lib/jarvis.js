// Conexión opcional con OpenJarvis (https://github.com/open-jarvis/OpenJarvis), un asistente de IA
// que corre en la computadora del usuario. Su servidor (`jarvis serve`) expone una API compatible
// con OpenAI en http://127.0.0.1:8000, así que los datos no salen del dispositivo.
// Los números siguen saliendo de lib/: la IA solo redacta el plan a partir de ellos.

import { NIVELES_ACTIVIDAD, OBJETIVOS } from './plan.js'

export const URL_POR_DEFECTO = 'http://127.0.0.1:8000'
const CLAVE_CONFIG = 'calculadora-grasa:jarvis'

function almacenamiento() {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

// Configuración guardada: { url, modelo }. La API key no se guarda.
export function leerConfigJarvis(storage = almacenamiento()) {
  try {
    const datos = JSON.parse(storage?.getItem(CLAVE_CONFIG) ?? 'null')
    return {
      url: typeof datos?.url === 'string' && datos.url ? datos.url : URL_POR_DEFECTO,
      modelo: typeof datos?.modelo === 'string' ? datos.modelo : '',
    }
  } catch {
    return { url: URL_POR_DEFECTO, modelo: '' }
  }
}

export function guardarConfigJarvis({ url, modelo }, storage = almacenamiento()) {
  try {
    storage?.setItem(CLAVE_CONFIG, JSON.stringify({ url, modelo }))
  } catch {
    // Almacenamiento bloqueado: se ignora.
  }
}

// Acepta "localhost:8000", "http://127.0.0.1:8000/" o ".../v1" y devuelve la base sin barra final.
export function normalizarUrl(url) {
  let base = (url ?? '').trim()
  if (!base) return URL_POR_DEFECTO
  if (!/^https?:\/\//i.test(base)) base = `http://${base}`
  return base.replace(/\/+$/, '').replace(/\/v1$/, '')
}

const redondear = (n, decimales = 1) => Number(n.toFixed(decimales))

// Arma los mensajes para el modelo con los datos ya calculados por la app.
export function construirMensajes({ datos, actividad, objetivo, porcentaje, categoria, masaGrasaKg, masaMagraKg, imc, plan }) {
  const perfil = {
    genero: datos.genero,
    edad: datos.edad,
    estatura_cm: redondear(datos.estaturaCm),
    peso_kg: redondear(datos.pesoKg),
    grasa_corporal_pct: redondear(porcentaje),
    categoria: categoria.nombre,
    masa_grasa_kg: redondear(masaGrasaKg),
    masa_magra_kg: redondear(masaMagraKg),
    imc: redondear(imc),
    actividad: NIVELES_ACTIVIDAD.find((n) => n.id === actividad)?.nombre ?? actividad,
    objetivo: OBJETIVOS.find((o) => o.id === objetivo)?.nombre ?? objetivo,
    kcal_mantenimiento: plan.mantenimiento,
    kcal_objetivo: plan.kcalObjetivo,
    proteina_g: plan.macros.proteinaG,
    grasas_g: plan.macros.grasaG,
    carbohidratos_g: plan.macros.carbohidratosG,
    avisos: plan.avisos,
  }

  return [
    {
      role: 'system',
      content:
        'Sos un entrenador y nutricionista que escribe en español rioplatense, claro y breve. ' +
        'Usá exactamente las calorías y macros que te pasan: no las recalcules ni las cambies. ' +
        'No des diagnósticos médicos y, si hay avisos, respetalos. Respondé en texto plano, sin tablas.',
    },
    {
      role: 'user',
      content:
        'Con estos datos de mi calculadora de grasa corporal (método U.S. Navy, es una estimación):\n' +
        `${JSON.stringify(perfil, null, 2)}\n\n` +
        'Escribime:\n' +
        '1. Un ejemplo de menú de un día que cumpla esas calorías y macros, repartido en comidas.\n' +
        '2. Una rutina semanal de entrenamiento día por día acorde a mi objetivo y nivel de actividad.\n' +
        '3. Tres consejos concretos para sostenerlo.',
    },
  ]
}

function encabezados(apiKey) {
  const h = { 'Content-Type': 'application/json' }
  if (apiKey) h.Authorization = `Bearer ${apiKey}`
  return h
}

async function pedir(url, opciones, fetchFn) {
  let respuesta
  try {
    respuesta = await fetchFn(url, opciones)
  } catch (e) {
    if (e?.name === 'AbortError') throw e
    throw new Error(
      'No se pudo conectar con OpenJarvis. Revisá que esté corriendo (`jarvis serve`) y que la dirección sea correcta.',
    )
  }
  if (respuesta.status === 401) {
    throw new Error('OpenJarvis pide una API key. Escribila en la configuración.')
  }
  if (!respuesta.ok) {
    let detalle = ''
    try {
      const cuerpo = await respuesta.json()
      detalle = cuerpo?.detail ?? cuerpo?.error?.message ?? ''
      if (typeof detalle !== 'string') detalle = JSON.stringify(detalle)
    } catch {
      // Sin cuerpo JSON.
    }
    throw new Error(`OpenJarvis respondió con error ${respuesta.status}${detalle ? `: ${detalle}` : ''}.`)
  }
  return respuesta.json()
}

// Lista los modelos disponibles en OpenJarvis (ids).
export async function listarModelos({ url, apiKey, fetchFn = fetch, signal } = {}) {
  const cuerpo = await pedir(`${normalizarUrl(url)}/v1/models`, { headers: encabezados(apiKey), signal }, fetchFn)
  return Array.isArray(cuerpo?.data) ? cuerpo.data.map((m) => m.id).filter(Boolean) : []
}

// Pide el plan detallado y devuelve el texto de la respuesta.
export async function pedirPlanJarvis({ url, apiKey, modelo, mensajes, fetchFn = fetch, signal }) {
  const cuerpo = await pedir(
    `${normalizarUrl(url)}/v1/chat/completions`,
    {
      method: 'POST',
      headers: encabezados(apiKey),
      body: JSON.stringify({ model: modelo, messages: mensajes, temperature: 0.4, max_tokens: 1500, stream: false }),
      signal,
    },
    fetchFn,
  )
  const texto = cuerpo?.choices?.[0]?.message?.content
  if (typeof texto !== 'string' || !texto.trim()) {
    throw new Error('OpenJarvis no devolvió texto. Probá con otro modelo.')
  }
  return texto.trim()
}
