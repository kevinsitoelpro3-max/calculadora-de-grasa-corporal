import { conSigno, formatearFecha, formatearPeso } from '../lib/formato.js'

export default function Historial({ mediciones, sistema, onBorrar }) {
  function borrar() {
    if (window.confirm('¿Borrar todas tus mediciones guardadas en este dispositivo?')) onBorrar()
  }

  return (
    <section className="tarjeta" aria-labelledby="titulo-historial">
      <h2 id="titulo-historial">Tus mediciones</h2>
      <p className="nota">Se guardan solo en este navegador. Si cambiás de dispositivo o borrás los datos del navegador, no se conservan.</p>
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
