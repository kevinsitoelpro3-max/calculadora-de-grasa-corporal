import { useEffect, useRef, useState } from 'react'
import {
  construirMensajes,
  guardarConfigJarvis,
  leerConfigJarvis,
  listarModelos,
  pedirPlanJarvis,
} from '../lib/jarvis.js'

// Plan detallado redactado por OpenJarvis, la IA que corre en la computadora del usuario.
export default function AsistenteJarvis({ resultado }) {
  const [config, setConfig] = useState(leerConfigJarvis)
  const [apiKey, setApiKey] = useState('')
  const [modelos, setModelos] = useState([])
  const [estado, setEstado] = useState('inactivo') // inactivo | cargando | listo | error
  const [texto, setTexto] = useState('')
  const [error, setError] = useState('')
  const controlador = useRef(null)

  // Si cambia el resultado, el plan anterior ya no corresponde.
  useEffect(() => {
    controlador.current?.abort()
    setEstado('inactivo')
    setTexto('')
    setError('')
  }, [resultado.plan])

  useEffect(() => () => controlador.current?.abort(), [])

  function cambiar(campo, valor) {
    const nueva = { ...config, [campo]: valor }
    setConfig(nueva)
    guardarConfigJarvis(nueva)
  }

  async function buscarModelos() {
    setError('')
    try {
      const lista = await listarModelos({ url: config.url, apiKey })
      setModelos(lista)
      if (lista.length === 0) setError('OpenJarvis no tiene modelos instalados. Instalá uno con `jarvis model pull`.')
      else if (!lista.includes(config.modelo)) cambiar('modelo', lista[0])
    } catch (e) {
      setError(e.message)
    }
  }

  async function pedir() {
    controlador.current?.abort()
    const actual = new AbortController()
    controlador.current = actual
    setEstado('cargando')
    setError('')
    setTexto('')
    try {
      let modelo = config.modelo
      if (!modelo) {
        const lista = await listarModelos({ url: config.url, apiKey, signal: actual.signal })
        setModelos(lista)
        modelo = lista[0] ?? ''
        if (!modelo) throw new Error('OpenJarvis no tiene modelos instalados. Instalá uno con `jarvis model pull`.')
        cambiar('modelo', modelo)
      }
      const respuesta = await pedirPlanJarvis({
        url: config.url,
        apiKey,
        modelo,
        mensajes: construirMensajes(resultado),
        signal: actual.signal,
      })
      setTexto(respuesta)
      setEstado('listo')
    } catch (e) {
      if (e?.name === 'AbortError') return
      setError(e.message)
      setEstado('error')
    }
  }

  const cargando = estado === 'cargando'

  return (
    <section className="tarjeta" aria-labelledby="titulo-jarvis">
      <h2 id="titulo-jarvis">Plan detallado con IA local</h2>
      <p className="nota">
        Usa <a href="https://github.com/open-jarvis/OpenJarvis" target="_blank" rel="noreferrer">OpenJarvis</a>, un
        asistente de IA que corre en tu computadora: tus datos no salen de tu dispositivo. Instalalo y arrancá el
        servidor con <code>jarvis serve</code>.
      </p>

      <details className="guia">
        <summary>Configuración</summary>
        <div className="jarvis-config">
          <div className="campo">
            <label htmlFor="jarvis-url">Dirección del servidor</label>
            <div className="entrada">
              <input
                id="jarvis-url"
                type="url"
                autoComplete="off"
                value={config.url}
                onChange={(e) => cambiar('url', e.target.value)}
              />
            </div>
          </div>
          <div className="campo">
            <label htmlFor="jarvis-modelo">Modelo</label>
            {modelos.length > 0 ? (
              <select id="jarvis-modelo" value={config.modelo} onChange={(e) => cambiar('modelo', e.target.value)}>
                {modelos.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            ) : (
              <div className="entrada">
                <input
                  id="jarvis-modelo"
                  type="text"
                  autoComplete="off"
                  placeholder="Automático"
                  value={config.modelo}
                  onChange={(e) => cambiar('modelo', e.target.value)}
                />
              </div>
            )}
            <button type="button" className="boton-secundario" onClick={buscarModelos}>Buscar modelos</button>
          </div>
          <div className="campo">
            <label htmlFor="jarvis-clave">API key (solo si la configuraste)</label>
            <div className="entrada">
              <input
                id="jarvis-clave"
                type="password"
                autoComplete="off"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
            <p className="ayuda">No se guarda: se usa solo mientras la página esté abierta.</p>
          </div>
        </div>
      </details>

      <button type="button" className="boton jarvis-boton" onClick={pedir} disabled={cargando}>
        {cargando ? 'Jarvis está escribiendo…' : estado === 'listo' ? 'Pedir otro plan' : 'Pedir plan detallado a Jarvis'}
      </button>

      {error && <p className="error" role="alert">{error}</p>}
      <div aria-live="polite">
        {texto && (
          <>
            <div className="jarvis-respuesta">{texto}</div>
            <p className="nota">
              Texto generado por IA a partir de tus números. Puede tener errores: no reemplaza a un profesional.
            </p>
          </>
        )}
      </div>
    </section>
  )
}
