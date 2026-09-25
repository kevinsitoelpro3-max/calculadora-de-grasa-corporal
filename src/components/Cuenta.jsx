import { useState } from 'react'
import { emailValido } from '../lib/nube.js'

export default function Cuenta({ sesion, sincronizando, errorNube, onEnviarEnlace, onCerrarSesion }) {
  const [email, setEmail] = useState('')
  const [estado, setEstado] = useState('inicial') // inicial | enviando | enviado | error
  const [mensaje, setMensaje] = useState('')

  if (sesion) {
    return (
      <section className="tarjeta cuenta" aria-label="Tu cuenta">
        <p className="cuenta-linea">
          <span>
            Conectado como <strong>{sesion.user.email}</strong>
          </span>
          <button type="button" className="boton-secundario" onClick={onCerrarSesion}>Cerrar sesión</button>
        </p>
        <p className="nota">
          {sincronizando ? 'Sincronizando tus mediciones…' : 'Tus mediciones se guardan en tu cuenta y las ves en cualquier dispositivo.'}
        </p>
        {errorNube && <p className="error" role="alert">{errorNube}</p>}
      </section>
    )
  }

  async function enviar(evento) {
    evento.preventDefault()
    if (!emailValido(email)) {
      setEstado('error')
      setMensaje('Escribí un email válido.')
      return
    }
    setEstado('enviando')
    try {
      await onEnviarEnlace(email.trim())
      setEstado('enviado')
    } catch {
      setEstado('error')
      setMensaje('No pudimos enviar el enlace. Esperá un minuto y probá de nuevo.')
    }
  }

  if (estado === 'enviado') {
    return (
      <section className="tarjeta cuenta" aria-live="polite">
        <p><strong>¡Listo! Revisá tu correo.</strong></p>
        <p className="nota">
          Te mandamos un enlace a <strong>{email.trim()}</strong>. Abrilo en este mismo dispositivo para entrar. Si no
          aparece, fijate en la carpeta de spam.
        </p>
        <button type="button" className="boton-secundario" onClick={() => setEstado('inicial')}>Usar otro email</button>
      </section>
    )
  }

  return (
    <section className="tarjeta cuenta" aria-labelledby="titulo-cuenta">
      <h2 id="titulo-cuenta">Guardá tu progreso</h2>
      <p className="nota">Creá tu cuenta gratis con tu email para ver tus mediciones en cualquier dispositivo. Sin contraseñas.</p>
      <form className="cuenta-form" onSubmit={enviar} noValidate>
        <label htmlFor="email" className="solo-lectores">Email</label>
        <div className={`entrada${estado === 'error' ? ' entrada-error' : ''}`}>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (estado === 'error') setEstado('inicial')
            }}
            aria-invalid={estado === 'error'}
            aria-describedby={estado === 'error' ? 'email-error' : undefined}
          />
        </div>
        <button type="submit" className="boton" disabled={estado === 'enviando'}>
          {estado === 'enviando' ? 'Enviando…' : 'Enviarme el enlace'}
        </button>
      </form>
      {estado === 'error' && <p id="email-error" className="error" role="alert">{mensaje}</p>}
    </section>
  )
}
