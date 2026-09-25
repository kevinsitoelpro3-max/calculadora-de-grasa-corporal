import { MARGEN_ERROR, rangosCategorias } from '../lib/bodyfat.js'
import { KG_POR_LIBRA } from '../lib/units.js'

const ESCALA_MAX = { hombre: 40, mujer: 48 }

function formatearPeso(kg, sistema) {
  return sistema === 'imperial' ? `${(kg / KG_POR_LIBRA).toFixed(1)} lb` : `${kg.toFixed(1)} kg`
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
    </section>
  )
}
