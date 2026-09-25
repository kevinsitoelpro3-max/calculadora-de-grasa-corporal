import { useState } from 'react'
import Campo from './Campo.jsx'
import Selector from './Selector.jsx'
import GuiaMedicion from './GuiaMedicion.jsx'
import { etiquetas } from '../lib/units.js'
import { validarFormulario } from '../lib/validation.js'
import { NIVELES_ACTIVIDAD, OBJETIVOS } from '../lib/plan.js'
import { guardarFormulario, leerFormulario } from '../lib/historial.js'

const INICIAL = {
  genero: 'hombre',
  sistema: 'metrico',
  edad: '',
  estatura: '',
  peso: '',
  cuello: '',
  cintura: '',
  cadera: '',
  actividad: 'moderado',
  objetivo: 'bajar',
}

// Recupera los últimos valores usados, ignorando claves desconocidas o de otro tipo.
function valoresIniciales() {
  const guardados = leerFormulario() ?? {}
  const valores = { ...INICIAL }
  for (const clave of Object.keys(INICIAL)) {
    if (typeof guardados[clave] === 'string') valores[clave] = guardados[clave]
  }
  return valores
}

export default function Formulario({ onCalcular }) {
  const [valores, setValores] = useState(valoresIniciales)
  const [errores, setErrores] = useState({})
  const [campoActivo, setCampoActivo] = useState(null)
  const unidad = etiquetas(valores.sistema)

  function cambiar(campo, valor) {
    setValores((v) => ({ ...v, [campo]: valor }))
    if (errores[campo]) setErrores((e) => ({ ...e, [campo]: undefined }))
  }

  function enviar(evento) {
    evento.preventDefault()
    const { datos, errores: nuevos } = validarFormulario(valores)
    setErrores(nuevos)
    if (datos) {
      guardarFormulario(valores)
      onCalcular(datos, { objetivo: valores.objetivo, actividad: valores.actividad, sistema: valores.sistema })
    }
  }

  const campoMedida = (id, texto, ayuda, u = unidad.largo) => (
    <Campo id={id} texto={texto} unidad={u} ayuda={ayuda} valor={valores[id]} error={errores[id]} onChange={cambiar} onFocus={setCampoActivo} />
  )

  return (
    <form className="tarjeta formulario" onSubmit={enviar} noValidate>
      <div className="fila-doble">
        <Selector
          nombre="genero"
          texto="Género"
          valor={valores.genero}
          opciones={[{ id: 'hombre', nombre: 'Hombre' }, { id: 'mujer', nombre: 'Mujer' }]}
          onChange={cambiar}
        />
        <Selector
          nombre="sistema"
          texto="Unidades"
          valor={valores.sistema}
          opciones={[{ id: 'metrico', nombre: 'cm / kg' }, { id: 'imperial', nombre: 'in / lb' }]}
          onChange={cambiar}
        />
      </div>

      <div className="fila-doble">
        {campoMedida('edad', 'Edad', null, 'años')}
        {campoMedida('peso', 'Peso', null, unidad.peso)}
      </div>
      {campoMedida('estatura', 'Estatura', null)}
      <GuiaMedicion genero={valores.genero} campoActivo={campoActivo} />
      {campoMedida('cuello', 'Cuello', 'Justo debajo de la nuez, con la cinta levemente inclinada hacia adelante.')}
      {campoMedida(
        'cintura',
        'Cintura',
        valores.genero === 'hombre'
          ? 'A la altura del ombligo, relajado y después de exhalar.'
          : 'En la parte más angosta de la cintura, relajada y después de exhalar.',
      )}
      {valores.genero === 'mujer' && campoMedida('cadera', 'Cadera', 'En la parte más ancha de los glúteos.')}

      <div className="campo">
        <label htmlFor="actividad">Nivel de actividad</label>
        <select id="actividad" value={valores.actividad} onChange={(e) => cambiar('actividad', e.target.value)}>
          {NIVELES_ACTIVIDAD.map((n) => (
            <option key={n.id} value={n.id}>{n.nombre}</option>
          ))}
        </select>
      </div>

      <Selector nombre="objetivo" texto="Objetivo" valor={valores.objetivo} opciones={OBJETIVOS} onChange={cambiar} />

      <button type="submit" className="boton">Calcular</button>
    </form>
  )
}
