import { conSigno, formatearFecha, formatearPeso } from '../lib/formato.js'

export default function Historial({ mediciones, sistema, enCuenta, onBorrar }) {
  function borrar() {
    const pregunta = enCuenta
      ? '¿Borrar todas tus mediciones de tu cuenta y de este dispositivo? No se puede deshacer.'
      : '¿Borrar todas tus mediciones guardadas en este dispositivo?'
    if (window.confirm(pregunta)) onBorrar()
  }

  return (
    <section className="tarjeta" aria-labelledby="titulo-historial">
      <h2 id="titulo-historial">Tus mediciones</h2>
      <p className="nota">
        {enCuenta
          ? 'Guardadas en tu cuenta.'
          : 'Se guardan solo en este navegador. Si cambiás de dispositivo o borrás los datos del navegador, no se conservan.'}
      </p>
      <table className="tabla-historial">
        <thead>
          <tr>
            <th scope="col">Fecha</th>
            <th scope="col">% grasa</th>
            <th scope="col">Peso</th>
          </tr>
        </thead>
        <tbody>
          {mediciones.map((m, i) => {
            const anterior = mediciones[i + 1]
            const comparable = anterior && anterior.genero === m.genero
            return (
              <tr key={m.fecha}>
                <td>{formatearFecha(m.fecha)}</td>
                <td>
                  {m.porcentaje.toFixed(1)}%
                  {comparable && <span className="delta-chico"> ({conSigno(m.porcentaje - anterior.porcentaje)})</span>}
                </td>
                <td>{formatearPeso(m.pesoKg, sistema)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <button type="button" className="boton-secundario" onClick={borrar}>Borrar historial</button>
    </section>
  )
}
