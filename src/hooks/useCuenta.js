import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import {
  borrarMedicionesNube,
  cerrarSesion,
  enviarEnlace,
  guardarMedicionNube,
  leerMedicionesNube,
  subirMedicionesLocales,
} from '../lib/nube.js'
import { leerHistorial } from '../lib/historial.js'

const ERROR_SINCRONIZAR = 'No se pudieron sincronizar tus mediciones. Revisá tu conexión y recargá la página.'

// Maneja la sesión de Supabase y el historial guardado en la cuenta.
// Si Supabase no está configurado, `disponible` es false y todo lo demás queda inactivo.
export default function useCuenta() {
  const [sesion, setSesion] = useState(null)
  const [historialNube, setHistorialNube] = useState(null) // null = todavía no cargado
  const [sincronizando, setSincronizando] = useState(false)
  const [errorNube, setErrorNube] = useState('')
  const userId = sesion?.user.id

  useEffect(() => {
    if (!supabase) return undefined
    supabase.auth.getSession().then(({ data }) => setSesion(data.session))
    const { data } = supabase.auth.onAuthStateChange((_evento, nueva) => setSesion(nueva))
    return () => data.subscription.unsubscribe()
  }, [])

  // Al iniciar sesión: sube lo que había en el navegador y trae el historial de la cuenta.
  useEffect(() => {
    if (!userId) {
      setHistorialNube(null)
      return undefined
    }
    let cancelado = false
    setSincronizando(true)
    setErrorNube('')
    ;(async () => {
      try {
        await subirMedicionesLocales(supabase, leerHistorial(), userId)
        const lista = await leerMedicionesNube(supabase)
        if (!cancelado) setHistorialNube(lista)
      } catch {
        if (!cancelado) setErrorNube(ERROR_SINCRONIZAR)
      } finally {
        if (!cancelado) setSincronizando(false)
      }
    })()
    return () => {
      cancelado = true
    }
  }, [userId])

  const guardar = useCallback(
    async (medicion) => {
      if (!userId) return
      setHistorialNube((lista) => [medicion, ...(lista ?? [])])
      try {
        await guardarMedicionNube(supabase, medicion, userId)
      } catch {
        setErrorNube('No se pudo guardar la última medición en tu cuenta. Quedó guardada en este navegador.')
      }
    },
    [userId],
  )

  const borrarTodo = useCallback(async () => {
    if (!userId) return
    try {
      await borrarMedicionesNube(supabase, userId)
      setHistorialNube([])
    } catch {
      setErrorNube('No se pudo borrar el historial de tu cuenta. Probá de nuevo.')
    }
  }, [userId])

  return {
    disponible: Boolean(supabase),
    sesion,
    historialNube: userId ? historialNube : null,
    sincronizando,
    errorNube,
    enviarEnlace: (email) => enviarEnlace(supabase, email, window.location.origin),
    cerrarSesion: () => cerrarSesion(supabase),
    guardar,
    borrarTodo,
  }
}
