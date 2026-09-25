// Historial de mediciones guardado en el navegador (localStorage).
// No hay servidor: los datos quedan solo en el dispositivo del usuario.
// Si el almacenamiento no está disponible (modo privado, bloqueado), la app sigue funcionando sin historial.

const CLAVE_HISTORIAL = 'calculadora-grasa:historial'
const CLAVE_FORMULARIO = 'calculadora-grasa:formulario'
const CLAVE_PREFERENCIAS = 'calculadora-grasa:preferencias'
const MAXIMO_MEDICIONES = 20
const MS_POR_DIA = 24 * 60 * 60 * 1000

function almacenamiento() {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function leer(clave, storage) {
  try {
    const texto = storage?.getItem(clave)
    return texto ? JSON.parse(texto) : null
  } catch {
    return null
  }
}

function escribir(clave, valor, storage) {
  try {
    if (valor === null) storage?.removeItem(clave)
    else storage?.setItem(clave, JSON.stringify(valor))
  } catch {
    // Sin espacio o almacenamiento bloqueado: se ignora.
  }
}

// Devuelve las mediciones de la más nueva a la más vieja.
export function leerHistorial(storage = almacenamiento()) {
  const datos = leer(CLAVE_HISTORIAL, storage)
  return Array.isArray(datos) ? datos : []
}

export function guardarMedicion(medicion, storage = almacenamiento()) {
  const lista = [medicion, ...leerHistorial(storage)].slice(0, MAXIMO_MEDICIONES)
  escribir(CLAVE_HISTORIAL, lista, storage)
  return lista
}

export function borrarHistorial(storage = almacenamiento()) {
  escribir(CLAVE_HISTORIAL, null, storage)
  escribir(CLAVE_FORMULARIO, null, storage)
  escribir(CLAVE_PREFERENCIAS, null, storage)
}

// Preferencias del panel premium (meta, días de entrenamiento, lugar, opciones del menú).
export function leerPreferencias(storage = almacenamiento()) {
  const datos = leer(CLAVE_PREFERENCIAS, storage)
  return datos && typeof datos === 'object' ? datos : {}
}

export function guardarPreferencias(preferencias, storage = almacenamiento()) {
  escribir(CLAVE_PREFERENCIAS, preferencias, storage)
}

// Últimos valores del formulario, para no tener que escribirlos de nuevo.
export function leerFormulario(storage = almacenamiento()) {
  const datos = leer(CLAVE_FORMULARIO, storage)
  return datos && typeof datos === 'object' ? datos : null
}

export function guardarFormulario(valores, storage = almacenamiento()) {
  escribir(CLAVE_FORMULARIO, valores, storage)
}

// Diferencias entre la medición actual y la anterior (actual − anterior).
// Devuelve null si no hay anterior o si es de otro género (no son comparables).
export function compararMediciones(actual, anterior) {
  if (!anterior || anterior.genero !== actual.genero) return null
  return {
    fechaAnterior: anterior.fecha,
    dias: Math.round((new Date(actual.fecha) - new Date(anterior.fecha)) / MS_POR_DIA),
    porcentaje: actual.porcentaje - anterior.porcentaje,
    pesoKg: actual.pesoKg - anterior.pesoKg,
    masaGrasaKg: actual.masaGrasaKg - anterior.masaGrasaKg,
    masaMagraKg: actual.masaMagraKg - anterior.masaMagraKg,
  }
}
