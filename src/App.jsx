import { useRef, useState } from 'react'
import Formulario from './components/Formulario.jsx'
import Resultado from './components/Resultado.jsx'
import Plan from './components/Plan.jsx'
import { categoria, composicion, imc, porcentajeGrasaNavy } from './lib/bodyfat.js'
import { generarPlan } from './lib/plan.js'

function calcular(datos, { objetivo, actividad }) {
  const porcentaje = porcentajeGrasaNavy(datos)
  const cat = categoria(datos.genero, porcentaje)
  const { masaGrasaKg, masaMagraKg } = composicion({ pesoKg: datos.pesoKg, porcentaje })
  return {
    genero: datos.genero,
    porcentaje,
    categoria: cat,
    imc: imc(datos.pesoKg, datos.estaturaCm),
    masaGrasaKg,
    masaMagraKg,
    plan: generarPlan({ ...datos, masaMagraKg, categoriaId: cat.id, objetivo, actividad }),
    objetivo,
  }
}

export default function App() {
  const [resultado, setResultado] = useState(null)
  const [sistema, setSistema] = useState('metrico')
  const resultadoRef = useRef(null)

  function manejarCalculo(datos, preferencias) {
    setResultado(calcular(datos, preferencias))
    setSistema(preferencias.sistema)
    requestAnimationFrame(() => resultadoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  return (
    <div className="contenedor">
      <header className="encabezado">
        <h1>Calculadora de grasa corporal</h1>
        <p>Estimá tu % de grasa con el método U.S. Navy y recibí un plan básico de dieta y entrenamiento.</p>
      </header>

      <main>
        <Formulario onCalcular={manejarCalculo} />
        {resultado && (
          <div ref={resultadoRef} className="resultados">
            <Resultado resultado={resultado} sistema={sistema} />
            <Plan plan={resultado.plan} objetivo={resultado.objetivo} />
          </div>
        )}
      </main>

      <footer className="pie">
        <p>
          Esta herramienta da una <strong>estimación</strong> con fines informativos y no reemplaza la
          consulta con un médico, nutricionista o entrenador. Tus datos no salen de tu navegador.
        </p>
      </footer>
    </div>
  )
}
