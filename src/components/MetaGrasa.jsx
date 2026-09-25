import { useState } from 'react'
import { calcularMeta, progresoHaciaMeta, RANGO_META, validarMeta } from '../lib/meta.js'
import { formatearFecha, formatearPeso } from '../lib/formato.js'

export default function MetaGrasa({ resultado, mediciones, sistema, meta, onCambiarMeta }) {
  const rango = RANGO_META[resultado.genero]
  const metaActual = meta ?? rango.sugerida
  const [texto, setTexto] = useState(String(metaActual))
  const numero = Number(texto.replace(',', '.'))
  const error = texto === '' ? 'Escribí tu meta.' : validarMeta(resultado.genero, numero)
  const metaValida = error ? metaActual : numero

  const calculo = calcularMeta(
    { pesoKg: resultado.pesoKg, masaMagraKg: resultado.masaMagraKg, porcentaje: resultado.porcentaje },
    metaValida,
  )
  // La primera medición guardada es el punto de partida del progreso.
  const inicial = mediciones.length > 0 ? mediciones.reduce((a, b) => (a.fecha < b.fecha ? a : b)).porcentaje : resultado.porcentaje
  const progreso = progresoHaciaMeta(inicial, resultado.porcentaje, metaValida)

  return (
    <div className="meta">
      <div className="campo meta-campo">
        <label htmlFor="meta">Tu meta de grasa corporal</label>
        <div className={`entrada${error ? ' entrada-error' : ''}`}>
          <input
            id="meta"
            type="text"
            inputMode="decimal"
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value)
              const n = Number(e.target.value.replace(',', '.'))
              if (e.target.value !== '' && !validarMeta(resultado.genero, n)) onCambiarMeta(n)
            }}
            aria-invalid={Boolean(error)}
            aria-describedby="meta-ayuda"
          />
          <span className="unidad">%</span>
        </div>
        <p id="meta-ayuda" className={error ? 'error' : 'ayuda'}>
          {error ?? `Rango saludable para empezar: ${rango.sugerida - 3}–${rango.sugerida + 3}%.`}
        </p>
      </div>

      {calculo.alcanzada ? (
        <p className="meta-logro">🎉 Ya estás en tu meta o por debajo. Podés mantener o fijar una nueva.</p>
      ) : (
        <>
          <dl className="metricas cuatro">
            <div><dt>Peso meta</dt><dd>{formatearPeso(calculo.pesoMetaKg, sistema)}</dd></div>
            <div><dt>Grasa a perder</dt><dd>{formatearPeso(calculo.grasaAPerderKg, sistema)}</dd></div>
            <div><dt>Tiempo estimado</dt><dd>{calculo.semanas} sem.</dd></div>
            <div><dt>Fecha estimada</dt><dd>{formatearFecha(calculo.fechaEstimada)}</dd></div>
          </dl>
          <p className="nota">
            Calculado bajando unos {formatearPeso(calculo.perdidaSemanalKg, sistema)} por semana (0,7 % de tu peso) y
            conservando tu masa magra, con el plan de alimentación y la rutina de este panel.
          </p>
        </>
      )}

      <div className="progreso-meta">
        <div className="progreso-texto">
          <span>Progreso hacia tu meta</span>
          <strong>{Math.round(progreso * 100)}%</strong>
        </div>
        <div
          className="barra-progreso"
          role="progressbar"
          aria-valuenow={Math.round(progreso * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progreso hacia tu meta"
        >
          <span style={{ width: `${progreso * 100}%` }} />
        </div>
        <p className="nota">
          Desde {inicial.toFixed(1)}% (tu primera medición) hasta {metaValida}%. Hoy: {resultado.porcentaje.toFixed(1)}%.
        </p>
      </div>
    </div>
  )
}
