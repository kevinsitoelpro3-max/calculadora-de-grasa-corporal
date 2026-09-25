import { generarMenu } from '../lib/menu.js'

export default function MenuDelDia({ plan, elecciones, onElegir }) {
  const menu = generarMenu(plan.macros, elecciones)

  return (
    <div className="menu">
      <p className="nota">
        Un día de ejemplo con tus {plan.kcalObjetivo} kcal. Las porciones son en crudo/cocido como se indica; pesalas las
        primeras veces hasta que las calcules a ojo. Tocá <em>Otra opción</em> para cambiar una comida.
      </p>

      {menu.comidas.map((c) => (
        <article key={c.id} className="comida">
          <div className="comida-encabezado">
            <h4>{c.nombre}</h4>
            <span className="comida-kcal">{Math.round(c.kcal)} kcal</span>
          </div>
          <ul className="lista">
            {c.items.map((item) => <li key={item.texto}>{item.texto}</li>)}
            {c.libre && <li className="libre">{c.libre}</li>}
          </ul>
          <p className="comida-macros">
            P {Math.round(c.macros.proteinaG)} g · C {Math.round(c.macros.carbohidratosG)} g · G {Math.round(c.macros.grasaG)} g
          </p>
          {c.cantidadOpciones > 1 && (
            <button
              type="button"
              className="boton-enlace no-imprimir"
              onClick={() => onElegir(c.id, (c.indice + 1) % c.cantidadOpciones)}
              aria-label={`Otra opción de ${c.nombre.toLowerCase()} (${c.indice + 1} de ${c.cantidadOpciones})`}
            >
              Otra opción ({c.indice + 1}/{c.cantidadOpciones}) ↻
            </button>
          )}
        </article>
      ))}

      <dl className="metricas cuatro">
        <div><dt>Total</dt><dd>{Math.round(menu.kcal)} kcal</dd></div>
        <div><dt>Proteína</dt><dd>{Math.round(menu.total.proteinaG)} g</dd></div>
        <div><dt>Carbohidratos</dt><dd>{Math.round(menu.total.carbohidratosG)} g</dd></div>
        <div><dt>Grasas</dt><dd>{Math.round(menu.total.grasaG)} g</dd></div>
      </dl>
      <p className="nota">Valores nutricionales aproximados. Si tenés alguna condición médica o alergia, consultá con un nutricionista.</p>
    </div>
  )
}
