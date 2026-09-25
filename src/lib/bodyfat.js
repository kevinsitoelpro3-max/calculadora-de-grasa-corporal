// Estimación de composición corporal con el método U.S. Navy (Hodgdon y Beckett, 1984),
// en su versión métrica (medidas en centímetros).
//
//   Hombres: %GC = 495 / (1.0324 − 0.19077·log10(cintura − cuello) + 0.15456·log10(estatura)) − 450
//   Mujeres: %GC = 495 / (1.29579 − 0.35004·log10(cintura + cadera − cuello) + 0.22100·log10(estatura)) − 450
//
// El método tiene un margen de error típico de ±3 a 4 puntos porcentuales.

export const MARGEN_ERROR = 3.5

export function porcentajeGrasaNavy({ genero, estaturaCm, cuelloCm, cinturaCm, caderaCm }) {
  let resultado
  if (genero === 'hombre') {
    const diferencia = cinturaCm - cuelloCm
    if (diferencia <= 0) throw new Error('La cintura debe ser mayor que el cuello.')
    resultado =
      495 / (1.0324 - 0.19077 * Math.log10(diferencia) + 0.15456 * Math.log10(estaturaCm)) - 450
  } else if (genero === 'mujer') {
    const suma = cinturaCm + caderaCm - cuelloCm
    if (!(caderaCm > 0)) throw new Error('La cadera es obligatoria para mujeres.')
    if (suma <= 0) throw new Error('Las medidas no son válidas.')
    resultado =
      495 / (1.29579 - 0.35004 * Math.log10(suma) + 0.221 * Math.log10(estaturaCm)) - 450
  } else {
    throw new Error('Género no válido.')
  }
  // Por debajo de ~2 % el resultado no es fisiológicamente posible.
  return Math.max(resultado, 2)
}

// Rangos del American Council on Exercise (ACE), en % de grasa corporal.
// "hasta" es el límite superior (excluido) de cada categoría.
const CATEGORIAS = {
  hombre: [
    { id: 'esencial', nombre: 'Grasa esencial', hasta: 6 },
    { id: 'atletico', nombre: 'Atlético', hasta: 14 },
    { id: 'fitness', nombre: 'Fitness', hasta: 18 },
    { id: 'aceptable', nombre: 'Aceptable', hasta: 25 },
    { id: 'obesidad', nombre: 'Obesidad', hasta: Infinity },
  ],
  mujer: [
    { id: 'esencial', nombre: 'Grasa esencial', hasta: 14 },
    { id: 'atletico', nombre: 'Atlético', hasta: 21 },
    { id: 'fitness', nombre: 'Fitness', hasta: 25 },
    { id: 'aceptable', nombre: 'Aceptable', hasta: 32 },
    { id: 'obesidad', nombre: 'Obesidad', hasta: Infinity },
  ],
}

export function rangosCategorias(genero) {
  return CATEGORIAS[genero]
}

export function categoria(genero, porcentaje) {
  return CATEGORIAS[genero].find((c) => porcentaje < c.hasta)
}

export function imc(pesoKg, estaturaCm) {
  const metros = estaturaCm / 100
  return pesoKg / (metros * metros)
}

export function composicion({ pesoKg, porcentaje }) {
  const masaGrasaKg = (pesoKg * porcentaje) / 100
  return { masaGrasaKg, masaMagraKg: pesoKg - masaGrasaKg }
}
