import { createClient } from '@supabase/supabase-js'

// Se configura con variables de entorno (archivo .env.local en tu compu, o en Vercel):
//   VITE_SUPABASE_URL=https://xxxx.supabase.co
//   VITE_SUPABASE_ANON_KEY=eyJ...   (la clave "anon/public", que es segura para el navegador)
// Si faltan, la app funciona igual pero sin cuentas: el historial queda solo en el navegador.
const url = import.meta.env.VITE_SUPABASE_URL
const claveAnonima = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = url && claveAnonima ? createClient(url, claveAnonima) : null
