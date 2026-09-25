import { MARGEN_ERROR, rangosCategorias } from '../lib/bodyfat.js'
import { KG_POR_LIBRA } from '../lib/units.js'
import { conSigno, formatearFecha, formatearPeso, textoDias } from '../lib/formato.js'

const ESCALA_MAX = { hombre: 40, mujer: 48 }

// "bueno" si el cambio va en la dirección deseada (menos grasa, más músculo).
function tono(valor, deseable) {
  if (Math.abs(valor) < 0.05) return ''
  return (valor < 0) === (deseable === 'bajar') ? ' delta-bueno' : ' delta-malo'
}

function Comparacion({ comparacion, sistema }) {
  const pesoConSigno = (kg) => {
    const unidad = sistema === 'imperial' ? 'lb' : 'kg'
    return `${conSigno(sistema === 'imperial' ? kg / KG_POR_LIBRA : kg)} ${unidad}`
  }
  const filas = [
    { nombre: '% de grasa', valor: `${conSigno(comparacion.porcentaje)} puntos`, clase: tono(comparacion.porcentaje, 'bajar') },
    { nombre: 'Peso', valor: pesoConSigno(comparacion.pesoKg), clase: '' },
    { nombre: 'Masa grasa', valor: pesoConSigno(comparacion.masaGrasaKg), clase: tono(comparacion.masaGrasaKg, 'bajar') },
    { nombre: 'Masa magra', valor: pesoConSigno(comparacion.masaMagraKg), clase: tono(comparacion.masaMagraKg, 'subir') },
  ]
  return (
    <div className="comparacion">
      <h3>
        Cambio desde tu medición del {formatearFecha(comparacion.fechaAnterior)} ({textoDias(comparacion.dias)})
      </h3>
      <dl className="metricas cuatro">
        {filas.map((f) => (
          <div key={f.nombre}><dt>{f.nombre}</dt><dd className={f.clase.trim() || undefined}>{f.valor}</dd></div>
        ))}
      </dl>
      <p className="nota">
        Cambios de 1–2 puntos pueden deberse a pequeñas diferencias al medir. Mirá la tendencia de varias semanas.
      </p>
    </div>
  )
}

function textoRango(rangos, i) {
  const { hasta } = rangos[i]
  if (i === 0) return `menos de ${hasta}%`
  const desde = rangos[i - 1].hasta
  return hasta === Infinity ? `${desde}% o más` : `${desde}–${hasta}%`
}

export default function Resultado({ resultado, sistema }) {
  const { genero, porcentaje, categoria, imc, masaGrasaKg, masaMagraKg } = resultado
  const rangos = rangosCategorias(genero)
  const max = ESCALA_MAX[genero]
  const posicion = Math.min((porcentaje / max) * 100, 100)
  let desde = 0

  return (
    <section className="tarjeta" aria-labelledby="titulo-resultado">
      <h2 id="titulo-resultado">Tu resultado</h2>
      <div className="cifra">
        <span className="numero">{porcentaje.toFixed(1)}%</span>
        <span className={`insignia cat-${categoria.id}`}>{categoria.nombre}</span>
      </div>
      <p className="nota">
        Estimación de grasa corporal. El método U.S. Navy tiene un margen de error de ±{MARGEN_ERROR} puntos
        aproximadamente, así que tu valor real puede estar entre {Math.max(porcentaje - MARGEN_ERROR, 2).toFixed(1)}% y{' '}
        {(porcentaje + MARGEN_ERROR).toFixed(1)}%.
      </p>

      <div className="escala" aria-hidden="true">
        <div className="barra">
          {rangos.map((r) => {
            const hasta = Math.min(r.hasta, max)
            const ancho = ((hasta - desde) / max) * 100
            desde = hasta
            return <span key={r.id} className={`tramo cat-${r.id}`} style={{ width: `${ancho}%` }} />
          })}
        </div>
        <span className="marcador" style={{ left: `${posicion}%` }} />
      </div>
      <ul className="leyenda">
        {rangos.map((r, i) => (
          <li key={r.id}>
            <span className={`punto cat-${r.id}`} />
            {r.nombre}: {textoRango(rangos, i)}
          </li>
        ))}
      </ul>

      <dl className="metricas">
        <div><dt>Masa grasa</dt><dd>{formatearPeso(masaGrasaKg, sistema)}</dd></div>
        <div><dt>Masa magra</dt><dd>{formatearPeso(masaMagraKg, sistema)}</dd></div>
        <div><dt>IMC</dt><dd>{imc.toFixed(1)}</dd></div>
      </dl>

      {resultado.comparacion && <Comparacion comparacion={resultado.comparacion} sistema={sistema} />}
    </section>
  )
}
