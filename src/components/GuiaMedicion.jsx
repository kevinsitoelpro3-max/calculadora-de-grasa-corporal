import { useEffect, useState } from 'react'

// Guía ilustrada de dónde medir. Resalta la zona del campo que el usuario está completando.

const ZONAS = {
  cuello: {
    titulo: 'Cuello',
    texto: 'Justo debajo de la nuez (cartílago tiroides). Inclinás la cinta levemente hacia abajo, hacia adelante. Mirá al frente, sin tensar el cuello.',
  },
  cintura: {
    hombre: {
      titulo: 'Cintura',
      texto: 'A la altura del ombligo, con la cinta paralela al piso. Medí relajado y después de exhalar normalmente, sin meter la panza.',
    },
    mujer: {
      titulo: 'Cintura',
      texto: 'En la parte más angosta, entre las costillas y el ombligo, con la cinta paralela al piso. Medí relajada y después de exhalar normalmente.',
    },
  },
  cadera: {
    titulo: 'Cadera',
    texto: 'En la parte más ancha de los glúteos, con los pies juntos y la cinta paralela al piso.',
  },
}

const CONSEJOS = [
  'Usá una cinta métrica flexible, ajustada pero sin hundir la piel.',
  'Medí sobre la piel, de pie, relajado y mirando al frente.',
  'Tomá cada medida 2 o 3 veces y usá el promedio.',
  'Para comparar tus resultados, medite siempre en las mismas condiciones: por ejemplo, a la mañana y en ayunas.',
]

function zona(id, genero) {
  const z = ZONAS[id]
  return z.titulo ? z : z[genero]
}

// Posición vertical de cada medida sobre la silueta (coordenadas del SVG).
function lineas(genero) {
  return [
    { id: 'cuello', y: 70, rx: 13 },
    { id: 'cintura', y: genero === 'hombre' ? 170 : 156, rx: genero === 'hombre' ? 38 : 34 },
    ...(genero === 'mujer' ? [{ id: 'cadera', y: 200, rx: 46 }] : []),
  ]
}

export default function GuiaMedicion({ genero, campoActivo }) {
  const activa = ZONAS[campoActivo] && (campoActivo !== 'cadera' || genero === 'mujer') ? campoActivo : null
  const detalle = activa ? zona(activa, genero) : null
  const [abierta, setAbierta] = useState(false)

  // Se abre sola al tocar un campo de medida; después el usuario la puede cerrar.
  useEffect(() => {
    if (activa) setAbierta(true)
  }, [activa])

  return (
    <details className="guia" open={abierta} onToggle={(e) => setAbierta(e.currentTarget.open)}>
      <summary>¿Cómo medirme correctamente?</summary>
      <div className="guia-contenido">
        <svg
          className="silueta"
          viewBox="0 0 250 300"
          role="img"
          aria-label={`Silueta que indica dónde medir cuello, cintura${genero === 'mujer' ? ' y cadera' : ''}.`}
        >
          <circle className="cuerpo" cx="100" cy="36" r="22" />
          <rect className="cuerpo" x="90" y="54" width="20" height="24" rx="4" />
          <path
            className="cuerpo"
            d={
              genero === 'mujer'
                ? 'M88 74 L112 74 C130 76 142 80 144 94 L136 140 C133 150 130 154 130 158 C142 176 148 190 146 212 L136 292 L108 292 L100 226 L92 292 L64 292 L54 212 C52 190 58 176 70 158 C70 154 67 150 64 140 L56 94 C58 80 70 76 88 74 Z'
                : 'M86 74 L114 74 C136 76 150 80 152 96 L142 150 C140 162 138 170 138 176 C142 190 142 200 140 214 L134 292 L108 292 L100 226 L92 292 L66 292 L60 214 C58 200 58 190 62 176 C62 170 60 162 58 150 L48 96 C50 80 64 76 86 74 Z'
            }
          />
          {lineas(genero).map((l) => {
            const esActiva = l.id === activa
            return (
              <g key={l.id} className={`medida${esActiva ? ' activa' : ''}`}>
                <ellipse cx="100" cy={l.y} rx={l.rx} ry="5" />
                <line x1={100 + l.rx + 4} y1={l.y} x2="166" y2={l.y} />
                <text x="170" y={l.y + 4}>{zona(l.id, genero).titulo}</text>
              </g>
            )
          })}
        </svg>

        <div className="guia-texto">
          {detalle ? (
            <p className="guia-detalle">
              <strong>{detalle.titulo}:</strong> {detalle.texto}
            </p>
          ) : (
            <p className="guia-detalle">Tocá un campo de medida para ver exactamente dónde va la cinta.</p>
          )}
          <ul className="lista">
            {CONSEJOS.map((c) => <li key={c}>{c}</li>)}
          </ul>
        </div>
      </div>
    </details>
  )
}
