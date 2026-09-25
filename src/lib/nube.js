// Cuentas y mediciones guardadas en Supabase.
// Todas las funciones reciben el cliente para poder probarlas sin conexión.

const TABLA = 'mediciones'
const MAXIMO_MEDICIONES = 100

// Convierte entre el formato de la app y las columnas de la base de datos.
export function aFila(medicion, userId) {
  return {
    user_id: userId,
    fecha: medicion.fecha,
    genero: medicion.genero,
    porcentaje: redondear(medicion.porcentaje),
    peso_kg: redondear(medicion.pesoKg),
    masa_grasa_kg: redondear(medicion.masaGrasaKg),
    masa_magra_kg: redondear(medicion.masaMagraKg),
  }
}

export function deFila(fila) {
  return {
    fecha: new Date(fila.fecha).toISOString(),
    genero: fila.genero,
    porcentaje: Number(fila.porcentaje),
    pesoKg: Number(fila.peso_kg),
    masaGrasaKg: Number(fila.masa_grasa_kg),
    masaMagraKg: Number(fila.masa_magra_kg),
  }
}

function redondear(n) {
  return Math.round(n * 100) / 100
}

function verificar({ data, error }) {
  if (error) throw new Error(error.message)
  return data
}

export async function enviarEnlace(cliente, email, redirigirA) {
  verificar(await cliente.auth.signInWithOtp({ email, options: { emailRedirectTo: redirigirA } }))
}

export async function cerrarSesion(cliente) {
  verificar(await cliente.auth.signOut())
}

export async function leerMedicionesNube(cliente) {
  const filas = verificar(
    await cliente.from(TABLA).select('*').order('fecha', { ascending: false }).limit(MAXIMO_MEDICIONES),
  )
  return filas.map(deFila)
}

export async function guardarMedicionNube(cliente, medicion, userId) {
  verificar(await cliente.from(TABLA).insert(aFila(medicion, userId)))
}

// Sube las mediciones locales. Las que ya existen (misma fecha) se ignoran.
export async function subirMedicionesLocales(cliente, mediciones, userId) {
  if (mediciones.length === 0) return
  verificar(
    await cliente
      .from(TABLA)
      .upsert(mediciones.map((m) => aFila(m, userId)), { onConflict: 'user_id,fecha', ignoreDuplicates: true }),
  )
}

export async function borrarMedicionesNube(cliente, userId) {
  verificar(await cliente.from(TABLA).delete().eq('user_id', userId))
}

export function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}
