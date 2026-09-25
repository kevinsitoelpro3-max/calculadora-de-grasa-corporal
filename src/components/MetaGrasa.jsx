import { useState } from 'react'
import {
  calcularMeta,
  calcularMetaMusculo,
  progresoHaciaMeta,
  RANGO_META,
  resolverMeta,
  validarMeta,
  validarMetaMusculo,
} from '../lib/meta.js'
import { formatearFecha, formatearPeso } from '../lib/formato.js'
import { KG_POR_LIBRA } from '../lib/units.js'

const TIPOS = [
  { id: 'grasa', nombre: 'Bajar grasa' },
  { id: 'musculo', nombre: 'Ganar músculo' },
]

const aNumero = (texto) => Number(String(texto).replace(',', '.'))

// Campo numérico de la meta. Guarda el valor solo cuando es válido.
function CampoMeta({ id, etiqueta, unidad, valorInicial, validar, ayuda, onValido }) {
  const [texto, setTexto] = useState(valorInicial)
  const error = texto === '' ? 'Escribí tu meta.' : validar(aNumero(texto))
  return (
    <div className="campo meta-campo">
      <label htmlFor={id}>{etiqueta}</label>
      <div className={`entrada${error ? ' entrada-error' : ''}`}>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value)
            if (e.target.value !== '' && !validar(aNumero(e.target.value))) onValido(aNumero(e.target.value))
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={`${id}-ayuda`}
        />
        <span className="unidad">{unidad}</span>
      </div>
      <p id={`${id}-ayuda`} className={error ? 'error' : 'ayuda'}>{error ?? ayuda}</p>
    </div>
  )
}

function Resumen({ datos }) {
  return (
    <dl className="metricas cuatro">
      {datos.map(([nombre, valor]) => (
        <div key={nombre}><dt>{nombre}</dt><dd>{valor}</dd></div>
      ))}
    </dl>
  )
}

function Progreso({ valor, detalle }) {
  const porcentaje = Math.round(valor * 100)
  return (
    <div className="progreso-meta">
      <div className="progreso-texto">
        <span>Progreso hacia tu meta</span>
        <strong>{porcentaje}%</strong>
      </div>
      <div className="barra-progreso" role="progressbar" aria-valuenow={porcentaje} aria-valuemin={0} aria-valuemax={100} aria-label="Progreso hacia tu meta">
        <span style={{ width: `${valor * 100}%` }} />
      </div>
      <p className="nota">{detalle}</p>
    </div>
  )
}

export default function MetaGrasa({ resultado, primera, sistema, metaGuardada, onCambiar }) {
  const { genero } = resultado
  const { tipo, grasa: metaGrasa, musculoKg: metaMusculoKg } = resolverMeta(metaGuardada, resultado)
  const unidadPeso = sistema === 'imperial' ? 'lb' : 'kg'

  return (
    <div className="meta">
      <fieldset className="campo selector">
        <legend>Tu meta</legend>
        <div className="opciones">
          {TIPOS.map((t) => (
            <button key={t.id} type="button" className={`opcion${t.id === tipo ? ' activa' : ''}`} aria-pressed={t.id === tipo} onClick={() => onCambiar({ tipo: t.id })}>
              {t.nombre}
            </button>
          ))}
        </div>
      </fieldset>

      {tipo === 'grasa' ? (
        <MetaDeGrasa
          key={`grasa-${genero}`}
          resultado={resultado}
          primera={primera}
          meta={metaGrasa}
          sistema={sistema}
          onCambiar={(valor) => onCambiar({ grasa: valor })}
          onUsarMusculo={() => onCambiar({ tipo: 'musculo' })}
        />
      ) : (
        <MetaDeMusculo
          key={`musculo-${genero}-${sistema}`}
          resultado={resultado}
          primera={primera}
          kgAGanar={metaMusculoKg}
          sistema={sistema}
          unidadPeso={unidadPeso}
          onCambiar={(kg) => onCambiar({ musculoKg: kg })}
        />
      )}
    </div>
  )
}

function MetaDeGrasa({ resultado, primera, meta, sistema, onCambiar, onUsarMusculo }) {
  const { genero, porcentaje } = resultado
  const rango = RANGO_META[genero]
  const calculo = calcularMeta({ pesoKg: resultado.pesoKg, masaMagraKg: resultado.masaMagraKg, porcentaje }, meta)
  const progreso = progresoHaciaMeta(primera.porcentaje, porcentaje, meta)

  return (
    <>
      <CampoMeta
        id="meta"
        etiqueta="Meta de grasa corporal"
        unidad="%"
        valorInicial={String(meta)}
        validar={(n) => validarMeta(genero, n)}
        ayuda={`Hoy estás en ${porcentaje.toFixed(1)}%. Mínimo saludable: ${rango.min}%.`}
        onValido={onCambiar}
      />

      {calculo.alcanzada ? (
        <div className="meta-logro">
          <p>
            <strong>Ya estás en {porcentaje.toFixed(1)}%, por debajo de tu meta de {meta}%.</strong>{' '}
            {porcentaje <= rango.min + 2
              ? 'No conviene bajar más la grasa: tu próximo paso es ganar músculo.'
              : 'Bajá la meta para seguir avanzando, o proponete ganar músculo.'}
          </p>
          <button type="button" className="boton-enlace" onClick={onUsarMusculo}>Cambiar a meta de músculo →</button>
        </div>
      ) : (
        <>
          <Resumen
            datos={[
              ['Peso meta', formatearPeso(calculo.pesoMetaKg, sistema)],
              ['Grasa a perder', formatearPeso(calculo.grasaAPerderKg, sistema)],
              ['Tiempo estimado', `${calculo.semanas} sem.`],
              ['Fecha estimada', formatearFecha(calculo.fechaEstimada)],
            ]}
          />
          <p className="nota">
            Calculado bajando unos {formatearPeso(calculo.perdidaSemanalKg, sistema)} por semana (0,7 % de tu peso) y
            conservando tu masa magra, con el plan de alimentación y la rutina de este panel.
          </p>
        </>
      )}

      <Progreso
        valor={progreso}
        detalle={`Desde ${primera.porcentaje.toFixed(1)}% (tu primera medición) hasta ${meta}%. Hoy: ${porcentaje.toFixed(1)}%.`}
      />
    </>
  )
}

function MetaDeMusculo({ resultado, primera, kgAGanar, sistema, unidadPeso, onCambiar }) {
  const imperial = sistema === 'imperial'
  const aMostrar = (kg) => Number((imperial ? kg / KG_POR_LIBRA : kg).toFixed(1))
  const aKg = (n) => (imperial ? n * KG_POR_LIBRA : n)
  const calculo = calcularMetaMusculo(
    { inicialMagraKg: primera.masaMagraKg, actual: { masaMagraKg: resultado.masaMagraKg, porcentaje: resultado.porcentaje } },
    kgAGanar,
  )

  return (
    <>
      <CampoMeta
        id="meta-musculo"
        etiqueta="Músculo que querés ganar"
        unidad={unidadPeso}
        valorInicial={String(aMostrar(kgAGanar))}
        validar={(n) => validarMetaMusculo(aKg(n))}
        ayuda={`Contado desde tu primera medición (${formatearPeso(primera.masaMagraKg, sistema)} de masa magra). ${unidadPeso === 'kg' ? 'Entre 2 y 4 kg' : 'Entre 4 y 9 lb'} es un buen primer objetivo.`}
        onValido={(n) => onCambiar(aKg(n))}
      />

      {calculo.alcanzada ? (
        <p className="meta-logro"><strong>🎉 ¡Llegaste a tu meta de músculo!</strong> Subila para seguir progresando.</p>
      ) : (
        <>
          <Resumen
            datos={[
              ['Masa magra meta', formatearPeso(calculo.objetivoMagraKg, sistema)],
              ['Te falta ganar', formatearPeso(calculo.faltaKg, sistema)],
              ['Tiempo estimado', `${calculo.semanas} sem.`],
              ['Fecha estimada', formatearFecha(calculo.fechaEstimada)],
            ]}
          />
          <p className="nota">
            Calculado ganando unos {formatearPeso(0.5, sistema)} de músculo por mes, un ritmo realista si seguís la rutina
            y comés en superávit. Si mantenés tu % de grasa, pesarías unos {formatearPeso(calculo.pesoFinalKg, sistema)}.
          </p>
        </>
      )}

      <Progreso
        valor={calculo.progreso}
        detalle={`Masa magra: ${formatearPeso(primera.masaMagraKg, sistema)} en tu primera medición, ${formatearPeso(resultado.masaMagraKg, sistema)} hoy.`}
      />
    </>
  )
}
