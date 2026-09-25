// Conversión de unidades. Internamente todo se calcula en cm y kg.

export const CM_POR_PULGADA = 2.54
export const KG_POR_LIBRA = 0.45359237

export function aCm(valor, sistema) {
  return sistema === 'imperial' ? valor * CM_POR_PULGADA : valor
}

export function aKg(valor, sistema) {
  return sistema === 'imperial' ? valor * KG_POR_LIBRA : valor
}

export function etiquetas(sistema) {
  return sistema === 'imperial'
    ? { largo: 'in', peso: 'lb' }
    : { largo: 'cm', peso: 'kg' }
}
