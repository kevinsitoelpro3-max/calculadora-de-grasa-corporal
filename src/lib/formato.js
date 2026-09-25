import { KG_POR_LIBRA } from './units.js'

export function formatearPeso(kg, sistema, decimales = 1) {
  return sistema === 'imperial'
    ? `${(kg / KG_POR_LIBRA).toFixed(decimales)} lb`
    : `${kg.toFixed(decimales)} kg`
}

export function formatearFecha(iso) {
  return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Número con signo explícito (+1.2 / −0.8). Los cambios que redondean a cero se muestran como "0.0".
export function conSigno(valor, decimales = 1) {
  const redondeado = Number(valor.toFixed(decimales))
  if (redondeado === 0) return (0).toFixed(decimales)
  return `${redondeado > 0 ? '+' : '−'}${Math.abs(redondeado).toFixed(decimales)}`
}

export function textoDias(dias) {
  if (dias <= 0) return 'hoy'
  if (dias === 1) return 'hace 1 día'
  return `hace ${dias} días`
}
