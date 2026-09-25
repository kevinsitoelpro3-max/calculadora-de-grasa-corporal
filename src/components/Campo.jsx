export default function Campo({ id, texto, unidad, ayuda, valor, error, onChange }) {
  const idAyuda = ayuda ? `${id}-ayuda` : undefined
  const idError = error ? `${id}-error` : undefined
  return (
    <div className="campo">
      <label htmlFor={id}>{texto}</label>
      <div className={`entrada${error ? ' entrada-error' : ''}`}>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={valor}
          onChange={(e) => onChange(id, e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={[idAyuda, idError].filter(Boolean).join(' ') || undefined}
        />
        <span className="unidad">{unidad}</span>
      </div>
      {ayuda && <p id={idAyuda} className="ayuda">{ayuda}</p>}
      {error && <p id={idError} className="error" role="alert">{error}</p>}
    </div>
  )
}
