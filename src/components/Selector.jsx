// Grupo de botones de opción con aspecto de "pastillas".
export default function Selector({ nombre, texto, valor, opciones, onChange }) {
  return (
    <fieldset className="campo selector">
      <legend>{texto}</legend>
      <div className="opciones">
        {opciones.map((o) => (
          <label key={o.id} className={`opcion${valor === o.id ? ' activa' : ''}`}>
            <input
              type="radio"
              name={nombre}
              value={o.id}
              checked={valor === o.id}
              onChange={() => onChange(nombre, o.id)}
            />
            {o.nombre}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
