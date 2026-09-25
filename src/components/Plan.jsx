import { OBJETIVOS } from '../lib/plan.js'

function textoAjuste(ajuste) {
  if (ajuste < 0) return `déficit del ${Math.abs(ajuste)}%`
  if (ajuste > 0) return `superávit del ${ajuste}%`
  return 'calorías de mantenimiento'
}

export default function Plan({ plan, objetivo }) {
  const nombreObjetivo = OBJETIVOS.find((o) => o.id === objetivo).nombre
  const { proteinaG, grasaG, carbohidratosG } = plan.macros

  return (
    <section className="tarjeta" aria-labelledby="titulo-plan">
      <h2 id="titulo-plan">Tu plan básico: {nombreObjetivo.toLowerCase()}</h2>

      {plan.avisos.map((aviso) => (
        <p key={aviso} className="aviso" role="note">{aviso}</p>
      ))}

      <h3>Alimentación</h3>
      <p>
        Mantenimiento estimado: <strong>{plan.mantenimiento} kcal</strong>. Objetivo diario:{' '}
        <strong>{plan.kcalObjetivo} kcal</strong> ({textoAjuste(plan.ajustePorcentaje)}).
      </p>
      <dl className="metricas macros">
        <div><dt>Proteína</dt><dd>{proteinaG} g</dd></div>
        <div><dt>Grasas</dt><dd>{grasaG} g</dd></div>
        <div><dt>Carbohidratos</dt><dd>{carbohidratosG} g</dd></div>
      </dl>
      <p className="nota">
        Repartí la proteína en 3–5 comidas. Revisá tu peso cada semana y ajustá ±100–200 kcal si no avanzás
        después de 2–3 semanas.
      </p>

      <h3>Entrenamiento</h3>
      <p><strong>Frecuencia:</strong> {plan.entrenamiento.frecuencia}.</p>
      <p><strong>Rutina:</strong> {plan.entrenamiento.rutina}</p>
      <ul className="lista">
        {plan.entrenamiento.extras.map((e) => <li key={e}>{e}</li>)}
      </ul>
    </section>
  )
}
