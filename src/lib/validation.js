import { aCm, aKg } from './units.js'

// Rangos razonables (en cm, kg y años) para detectar errores de tipeo.
const RANGOS = {
  edad: { min: 15, max: 100, nombre: 'La edad' },
  estatura: { min: 120, max: 230, nombre: 'La estatura' },
  peso: { min: 30, max: 300, nombre: 'El peso' },
  cuello: { min: 20, max: 70, nombre: 'El cuello' },
  cintura: { min: 40, max: 200, nombre: 'La cintura' },
  cadera: { min: 50, max: 200, nombre: 'La cadera' },
}

// Recibe los valores del formulario (texto) y devuelve { datos, errores }.
// "datos" viene normalizado a cm y kg, y es null si hay errores.
export function validarFormulario(valores) {
  const { genero, sistema } = valores
  const errores = {}
  const datos = { genero }

  const campos = ['edad', 'estatura', 'peso', 'cuello', 'cintura']
  if (genero === 'mujer') campos.push('cadera')

  for (const campo of campos) {
    const numero = Number(String(valores[campo] ?? '').replace(',', '.'))
    if (valores[campo] === '' || valores[campo] == null || !Number.isFinite(numero)) {
      errores[campo] = 'Completá este campo.'
      continue
    }
    let normalizado = numero
    if (campo === 'peso') normalizado = aKg(numero, sistema)
    else if (campo !== 'edad') normalizado = aCm(numero, sistema)

    const rango = RANGOS[campo]
    if (normalizado < rango.min || normalizado > rango.max) {
      errores[campo] = `${rango.nombre} parece fuera de rango. Revisá el valor y la unidad.`
      continue
    }
    datos[campo] = normalizado
  }

  if (!errores.cintura && !errores.cuello && datos.cintura <= datos.cuello) {
    errores.cintura = 'La cintura debe ser mayor que el cuello.'
  }

  if (Object.keys(errores).length > 0) return { datos: null, errores }
  return {
    datos: {
      genero,
      edad: datos.edad,
      estaturaCm: datos.estatura,
      pesoKg: datos.peso,
      cuelloCm: datos.cuello,
      cinturaCm: datos.cintura,
      caderaCm: datos.cadera,
    },
    errores,
  }
}
