import { useState } from 'react'
import { formatearFecha } from '../lib/formato.js'
import { KG_POR_LIBRA } from '../lib/units.js'

const ANCHO = 340
const ALTO = 190
const MARGEN = { arriba: 16, derecha: 44, abajo: 26, izquierda: 34 }

const METRICAS = [
  { id: 'porcentaje', nombre: '% de grasa', unidad: '%', valor: (m) => m.porcentaje },
  { id: 'peso', nombre: 'Peso', unidad: 'kg', valor: (m) => m.pesoKg, esPeso: true },
  { id: 'magra', nombre: 'Masa magra', unidad: 'kg', valor: (m) => m.masaMagraKg, esPeso: true },
]

// Ticks "redondos" (1, 2, 5 × 10^n) que cubren el rango.
function ticksRedondos(min, max, cantidad = 4) {
  const paso0 = (max - min) / cantidad || 1
  const potencia = 10 ** Math.floor(Math.log10(paso0))
  const paso = [1, 2, 5, 10].map((m) => m * potencia).find((p) => p >= paso0)
  const inicio = Math.floor(min / paso) * paso
  const fin = Math.ceil(max / paso) * paso
  const ticks = []
  for (let v = inicio; v <= fin + paso / 2; v += paso) ticks.push(Number(v.toFixed(6)))
  return ticks
}

export default function GraficoEvolucion({ mediciones, sistema, meta }) {
  const [metricaId, setMetricaId] = useState('porcentaje')
  const [activo, setActivo] = useState(null)
  const metrica = METRICAS.find((m) => m.id === metricaId)
  const unidad = metrica.esPeso && sistema === 'imperial' ? 'lb' : metrica.unidad
  const convertir = (v) => (metrica.esPeso && sistema === 'imperial' ? v / KG_POR_LIBRA : v)

  const puntos = [...mediciones]
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map((m) => ({ fecha: m.fecha, t: new Date(m.fecha).getTime(), v: convertir(metrica.valor(m)) }))

  const lineaMeta = metricaId === 'porcentaje' && meta ? meta : null
  const valores = puntos.map((p) => p.v).concat(lineaMeta ?? [])
  const rangoV = Math.max(...valores) - Math.min(...valores)
  const ticks = ticksRedondos(Math.min(...valores) - rangoV * 0.1 - 0.5, Math.max(...valores) + rangoV * 0.1 + 0.5)
  const [yMin, yMax] = [ticks[0], ticks.at(-1)]

  const tMin = puntos[0].t
  const tMax = puntos.at(-1).t
  const anchoUtil = ANCHO - MARGEN.izquierda - MARGEN.derecha
  const altoUtil = ALTO - MARGEN.arriba - MARGEN.abajo
  // Si todas las mediciones son del mismo momento, se reparten parejas.
  const x = (p, i) =>
    MARGEN.izquierda + (tMax > tMin ? ((p.t - tMin) / (tMax - tMin)) * anchoUtil : (i / Math.max(puntos.length - 1, 1)) * anchoUtil)
  const y = (v) => MARGEN.arriba + (1 - (v - yMin) / (yMax - yMin)) * altoUtil

  const trazo = puntos.map((p, i) => `${i ? 'L' : 'M'}${x(p, i).toFixed(1)} ${y(p.v).toFixed(1)}`).join(' ')
  const area = `${trazo} L${x(puntos.at(-1), puntos.length - 1).toFixed(1)} ${y(yMin)} L${x(puntos[0], 0).toFixed(1)} ${y(yMin)} Z`
  const ultimo = puntos.length - 1
  const formato = (v) => `${v.toFixed(1)}${unidad === '%' ? '%' : ` ${unidad}`}`

  function puntoMasCercano(evento) {
    const caja = evento.currentTarget.getBoundingClientRect()
    const xSvg = ((evento.clientX - caja.left) / caja.width) * ANCHO
    let mejor = 0
    puntos.forEach((p, i) => {
      if (Math.abs(x(p, i) - xSvg) < Math.abs(x(puntos[mejor], mejor) - xSvg)) mejor = i
    })
    setActivo(mejor)
  }

  function teclado(evento) {
    if (evento.key === 'ArrowRight') setActivo((a) => Math.min((a ?? -1) + 1, ultimo))
    else if (evento.key === 'ArrowLeft') setActivo((a) => Math.max((a ?? ultimo + 1) - 1, 0))
    else return
    evento.preventDefault()
  }

  const sel = activo != null ? puntos[activo] : null
  const cambio = puntos.length > 1 ? puntos[ultimo].v - puntos[0].v : 0

  return (
    <div className="grafico">
      <div className="opciones metricas-selector" role="group" aria-label="Qué mostrar">
        {METRICAS.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`opcion${m.id === metricaId ? ' activa' : ''}`}
            aria-pressed={m.id === metricaId}
            onClick={() => {
              setMetricaId(m.id)
              setActivo(null)
            }}
          >
            {m.nombre}
          </button>
        ))}
      </div>

      <p className="grafico-titulo">
        {metrica.nombre}: {formato(puntos[ultimo].v)}
        {puntos.length > 1 && (
          <span className="nota"> ({cambio >= 0 ? '+' : '−'}{Math.abs(cambio).toFixed(1)} desde {formatearFecha(puntos[0].fecha)})</span>
        )}
      </p>

      <div className="grafico-lienzo">
        <svg
          viewBox={`0 0 ${ANCHO} ${ALTO}`}
          role="img"
          aria-label={`Evolución de ${metrica.nombre.toLowerCase()}: de ${formato(puntos[0].v)} a ${formato(puntos[ultimo].v)} en ${puntos.length} mediciones.`}
        >
          {ticks.map((t) => (
            <g key={t} className="eje">
              <line x1={MARGEN.izquierda} x2={ANCHO - MARGEN.derecha} y1={y(t)} y2={y(t)} />
              <text x={MARGEN.izquierda - 6} y={y(t) + 4} textAnchor="end">{t}</text>
            </g>
          ))}
          <text className="eje-fecha" x={MARGEN.izquierda} y={ALTO - 6}>{formatearFecha(puntos[0].fecha)}</text>
          {puntos.length > 1 && (
            <text className="eje-fecha" x={ANCHO - MARGEN.derecha} y={ALTO - 6} textAnchor="end">{formatearFecha(puntos[ultimo].fecha)}</text>
          )}

          {lineaMeta != null && (
            <g className="linea-meta">
              <line x1={MARGEN.izquierda} x2={ANCHO - MARGEN.derecha} y1={y(lineaMeta)} y2={y(lineaMeta)} />
              <text x={ANCHO - MARGEN.derecha + 4} y={y(lineaMeta) + 4}>Meta</text>
            </g>
          )}

          {puntos.length > 1 && <path className="serie-area" d={area} />}
          {puntos.length > 1 && <path className="serie-linea" d={trazo} />}
          {puntos.map((p, i) => (
            <circle key={p.fecha} className={`serie-punto${i === activo ? ' activo' : ''}`} cx={x(p, i)} cy={y(p.v)} r={i === activo || i === ultimo ? 5 : 3.5} />
          ))}
          <text className="etiqueta-final" x={x(puntos[ultimo], ultimo) + 8} y={y(puntos[ultimo].v) - 8}>
            {puntos[ultimo].v.toFixed(1)}
          </text>

          {sel && <line className="cursor" x1={x(sel, activo)} x2={x(sel, activo)} y1={MARGEN.arriba} y2={ALTO - MARGEN.abajo} />}

          <rect
            className="zona-interaccion"
            x="0"
            y="0"
            width={ANCHO}
            height={ALTO}
            tabIndex={0}
            aria-label="Recorré las mediciones con las flechas izquierda y derecha"
            onPointerMove={puntoMasCercano}
            onPointerDown={puntoMasCercano}
            onPointerLeave={() => setActivo(null)}
            onKeyDown={teclado}
            onBlur={() => setActivo(null)}
          />
        </svg>
        {sel && (
          <div
            className="tooltip"
            role="status"
            style={{
              left: `${(x(sel, activo) / ANCHO) * 100}%`,
              top: `${(y(sel.v) / ALTO) * 100}%`,
              transform: `translate(${activo > ultimo / 2 ? 'calc(-100% - 10px)' : '10px'}, -110%)`,
            }}
          >
            <span className="tooltip-fecha">{formatearFecha(sel.fecha)}</span>
            <strong>{formato(sel.v)}</strong>
          </div>
        )}
      </div>
    </div>
  )
}
