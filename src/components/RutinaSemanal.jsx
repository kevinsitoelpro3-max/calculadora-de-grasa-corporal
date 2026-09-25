import { generarRutina, OPCIONES_DIAS } from '../lib/rutina.js'

export default function RutinaSemanal({ objetivo, dias, lugar, onCambiar }) {
  const rutina = generarRutina({ objetivo, dias, lugar })

  return (
    <div className="rutina">
      <div className="rutina-controles no-imprimir">
        <fieldset className="campo selector">
          <legend>Días por semana</legend>
          <div className="opciones">
            {OPCIONES_DIAS.map((d) => (
              <button key={d} type="button" className={`opcion${d === dias ? ' activa' : ''}`} aria-pressed={d === dias} onClick={() => onCambiar({ dias: d })}>
                {d}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="campo selector">
          <legend>Dónde entrenás</legend>
          <div className="opciones">
            {[['gimnasio', 'Gimnasio'], ['casa', 'Casa']].map(([id, nombre]) => (
              <button key={id} type="button" className={`opcion${id === lugar ? ' activa' : ''}`} aria-pressed={id === lugar} onClick={() => onCambiar({ lugar: id })}>
                {nombre}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      {rutina.dias.map((dia) => (
        <article key={dia.titulo} className="dia-rutina">
          <h4>{dia.titulo}</h4>
          <table className="tabla-rutina">
            <thead>
              <tr>
                <th scope="col">Ejercicio</th>
                <th scope="col">Series × reps</th>
              </tr>
            </thead>
            <tbody>
              {dia.ejercicios.map((e) => (
                <tr key={e.nombre}>
                  <td>{e.nombre}</td>
                  <td className="series">{e.series} × {e.reps}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      ))}

      <p><strong>Descanso entre series:</strong> {rutina.descanso}.</p>
      <p><strong>Cardio:</strong> {rutina.cardio}</p>
      <ul className="lista">
        {rutina.consejos.map((c) => <li key={c}>{c}</li>)}
      </ul>
    </div>
  )
}
