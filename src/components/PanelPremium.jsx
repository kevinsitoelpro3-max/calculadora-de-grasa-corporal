import { useState } from 'react'
import GraficoEvolucion from './GraficoEvolucion.jsx'
import MetaGrasa from './MetaGrasa.jsx'
import MenuDelDia from './MenuDelDia.jsx'
import RutinaSemanal from './RutinaSemanal.jsx'
import { guardarPreferencias, leerPreferencias } from '../lib/historial.js'
import { resolverMeta } from '../lib/meta.js'

const PESTANAS = [
  { id: 'progreso', nombre: 'Progreso' },
  { id: 'menu', nombre: 'Menú' },
  { id: 'rutina', nombre: 'Rutina' },
]

// Funciones premium. Durante el lanzamiento están abiertas para todos; cuando se conecte el
// cobro (Stripe), este panel se bloqueará para quienes no tengan la suscripción activa.
export default function PanelPremium({ resultado, mediciones, sistema }) {
  const [pestana, setPestana] = useState('progreso')
  const [preferencias, setPreferencias] = useState(leerPreferencias)

  function cambiarPreferencias(cambios) {
    setPreferencias((p) => {
      const nuevas = { ...p, ...cambios }
      guardarPreferencias(nuevas)
      return nuevas
    })
  }

  function teclado(evento, i) {
    const siguiente = { ArrowRight: i + 1, ArrowLeft: i - 1 }[evento.key]
    if (siguiente == null) return
    const destino = PESTANAS[(siguiente + PESTANAS.length) % PESTANAS.length]
    setPestana(destino.id)
    document.getElementById(`pestana-${destino.id}`)?.focus()
  }

  const medicionesDelGenero = mediciones.filter((m) => m.genero === resultado.genero)
  // La primera medición guardada es el punto de partida del progreso.
  const primera = medicionesDelGenero.length > 0
    ? medicionesDelGenero.reduce((a, b) => (a.fecha < b.fecha ? a : b))
    : resultado
  const metaGuardada = preferencias.meta?.[resultado.genero]
  const meta = resolverMeta(metaGuardada, resultado)
  const lineasMeta = meta.tipo === 'grasa'
    ? { porcentaje: meta.grasa }
    : { magra: primera.masaMagraKg + meta.musculoKg }

  return (
    <section className="tarjeta panel-premium" aria-labelledby="titulo-premium">
      <div className="premium-encabezado">
        <h2 id="titulo-premium">Tu plan completo</h2>
        <span className="insignia-premium">Premium · gratis en el lanzamiento</span>
      </div>

      <div className="pestanas" role="tablist" aria-label="Secciones del plan">
        {PESTANAS.map((p, i) => (
          <button
            key={p.id}
            id={`pestana-${p.id}`}
            type="button"
            role="tab"
            aria-selected={pestana === p.id}
            aria-controls={`panel-${p.id}`}
            tabIndex={pestana === p.id ? 0 : -1}
            className={`pestana${pestana === p.id ? ' activa' : ''}`}
            onClick={() => setPestana(p.id)}
            onKeyDown={(e) => teclado(e, i)}
          >
            {p.nombre}
          </button>
        ))}
      </div>

      <div id="panel-progreso" role="tabpanel" aria-labelledby="pestana-progreso" className={`panel${pestana === 'progreso' ? '' : ' oculto'}`}>
        <h3 className="solo-impresion">Progreso</h3>
        <MetaGrasa
          resultado={resultado}
          primera={primera}
          sistema={sistema}
          metaGuardada={metaGuardada}
          onCambiar={(cambios) =>
            cambiarPreferencias({ meta: { ...preferencias.meta, [resultado.genero]: { ...meta, ...cambios } } })
          }
        />
        {medicionesDelGenero.length > 1 ? (
          <GraficoEvolucion
            key={meta.tipo}
            mediciones={medicionesDelGenero}
            sistema={sistema}
            metas={lineasMeta}
            metricaInicial={meta.tipo === 'grasa' ? 'porcentaje' : 'magra'}
          />
        ) : (
          <p className="aviso-suave">📈 Medite de nuevo en 1 o 2 semanas: con dos mediciones vas a ver acá el gráfico de tu evolución.</p>
        )}
      </div>

      <div id="panel-menu" role="tabpanel" aria-labelledby="pestana-menu" className={`panel${pestana === 'menu' ? '' : ' oculto'}`}>
        <h3 className="solo-impresion">Menú del día</h3>
        <MenuDelDia
          plan={resultado.plan}
          elecciones={preferencias.menu ?? {}}
          onElegir={(comida, indice) => cambiarPreferencias({ menu: { ...preferencias.menu, [comida]: indice } })}
        />
      </div>

      <div id="panel-rutina" role="tabpanel" aria-labelledby="pestana-rutina" className={`panel${pestana === 'rutina' ? '' : ' oculto'}`}>
        <h3 className="solo-impresion">Rutina semanal</h3>
        <RutinaSemanal
          objetivo={resultado.objetivo}
          dias={preferencias.dias ?? 3}
          lugar={preferencias.lugar ?? 'gimnasio'}
          onCambiar={cambiarPreferencias}
        />
      </div>

      <button type="button" className="boton-secundario no-imprimir" onClick={() => window.print()}>
        Descargar o imprimir mi plan (PDF)
      </button>
    </section>
  )
}
