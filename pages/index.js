// Etapa 3 del plan de unificación — login único con rol.
//
// Reemplaza el PIN de 4 dígitos hardcodeado (y la lista fija de 2 usuarios)
// por login real contra la entidad Usuario de fixus-cobros (contraseña por
// usuario, vía /api/login) y una pantalla de alta/edición de usuarios
// gestionable (solo visible para rol 'dueño', vía /api/usuarios).
//
// Cómo se comparte la sesión con las otras apps: en vez de una cookie de
// dominio común (hoy cada app vive en su propio *.vercel.app, sin dominio
// compartido), el Portal le agrega a cada link `?sesion=<token>` — un token
// firmado (fixus-auth, AUTH_SECRET) que la app de destino valida y convierte
// en su propia cookie. Ver fixus-shared/auth.js para el detalle completo.

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'

const APPS = [
  {
    id: 'tablero',
    nombre: 'Tablero Comercial',
    descripcion: 'Gestión de prospectos, pipeline y leads BCRA',
    url: 'https://fixus-tablero-comercial.vercel.app',
    icon: '📋',
    color: '#0e2c50',
    bg: '#eef4ff',
    border: '#c7d2f0',
  },
  {
    id: 'simulador',
    nombre: 'Simulador SGR',
    descripcion: 'Simulación de créditos y cuotas con SGR',
    url: 'https://simulador-fixus.vercel.app',
    icon: '🧮',
    color: '#059669',
    bg: '#ecfdf5',
    border: '#a7f3d0',
  },
  {
    id: 'evaluador',
    nombre: 'Evaluador',
    descripcion: 'Evaluación crediticia de empresas',
    url: 'https://evaluador-fixus.vercel.app',
    icon: '📊',
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#ddd6fe',
  },
  {
    id: 'cobros',
    nombre: 'Cobros y Pagos',
    descripcion: 'Seguimiento de comisiones, pagos y rentabilidad',
    url: 'https://fixus-cobros.vercel.app',
    icon: '💰',
    color: '#D97706',
    bg: '#FFFBEB',
    border: '#FDE68A',
  },
  {
    id: 'contenido',
    nombre: 'Generador LinkedIn',
    descripcion: 'Generación de contenido para LinkedIn con IA',
    url: 'https://fixus-content.vercel.app',
    icon: '📣',
    color: '#0077B5',
    bg: '#e8f4fc',
    border: '#bfdbfe',
  },
]

const SESSION_KEY = 'fixus_portal_sesion' // { token, usuario, exp }

function appUrlConSesion(app, token) {
  if (!token) return app.url
  const sep = app.url.includes('?') ? '&' : '?'
  return `${app.url}${sep}sesion=${encodeURIComponent(token)}`
}

export default function Portal() {
  const [sesion, setSesion] = useState(null) // { token, usuario }
  const [ready, setReady] = useState(false)
  const [vista, setVista] = useState('apps') // 'apps' | 'usuarios'

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed?.token && parsed?.usuario) setSesion(parsed)
      } catch {}
    }
    setReady(true)
  }, [])

  const handleLogin = useCallback((token, usuario) => {
    const nueva = { token, usuario }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(nueva))
    setSesion(nueva)
  }, [])

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY)
    setSesion(null)
    setVista('apps')
  }

  if (!ready) return null
  if (!sesion) return <LoginScreen onLogin={handleLogin} />

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f1f5f9',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <Header usuario={sesion.usuario} vista={vista} onCambiarVista={setVista} onLogout={handleLogout} />

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px' }}>
        {vista === 'apps' ? (
          <AppsGrid usuario={sesion.usuario} token={sesion.token} />
        ) : (
          <UsuariosAdmin token={sesion.token} />
        )}
      </div>
    </div>
  )
}

function Header({ usuario, vista, onCambiarVista, onLogout }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #0e2c50 0%, #1a4a7a 100%)',
      padding: '0 32px', height: 60,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        <div style={{ position: 'relative', width: 100, height: 32 }}>
          <Image src="/logo_white.png" alt="Fixus" fill style={{ objectFit: 'contain', objectPosition: 'left' }} />
        </div>
        {usuario.rol === 'dueño' && (
          <nav style={{ display: 'flex', gap: 4 }}>
            {[['apps', 'Apps'], ['usuarios', 'Usuarios']].map(([id, label]) => (
              <button
                key={id}
                onClick={() => onCambiarVista(id)}
                style={{
                  background: vista === id ? 'rgba(255,255,255,0.15)' : 'none',
                  border: 'none', color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 600,
                  borderRadius: 6, padding: '6px 12px', cursor: 'pointer',
                }}
              >
                {label}
              </button>
            ))}
          </nav>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: '#fff',
        }}>{usuario.inicial}</div>
        <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>{usuario.nombre}</span>
        <button onClick={onLogout} style={{
          background: 'none', border: '1px solid rgba(255,255,255,0.25)',
          color: 'rgba(255,255,255,0.6)', fontSize: 11, borderRadius: 6,
          padding: '3px 10px', cursor: 'pointer',
        }}>Salir</button>
      </div>
    </div>
  )
}

function AppsGrid({ usuario, token }) {
  return (
    <>
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#0e2c50', letterSpacing: '-0.5px' }}>
          Buen día, {usuario.nombre.split(' ')[0]}
        </div>
        <div style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>
          Seleccioná la herramienta que querés usar
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, alignItems: 'stretch' }}>
        {APPS.map(app => (
          <a
            key={app.id}
            href={appUrlConSesion(app, token)}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'none', display: 'flex' }}
          >
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              background: '#fff', borderRadius: 14, padding: '28px 24px',
              border: '1px solid #e2e8f0', cursor: 'pointer',
              transition: 'transform 0.15s, box-shadow 0.15s',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-3px)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'
              }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: app.bg, border: `1px solid ${app.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, marginBottom: 16, flexShrink: 0,
              }}>{app.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0e2c50', marginBottom: 6 }}>
                {app.nombre}
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5, flex: 1 }}>
                {app.descripcion}
              </div>
              <div style={{
                marginTop: 20, fontSize: 12, fontWeight: 600, color: app.color,
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                Abrir →
              </div>
            </div>
          </a>
        ))}
      </div>
    </>
  )
}

function LoginScreen({ onLogin }) {
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [selId, setSelId] = useState(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    fetch('/api/usuarios')
      .then(r => r.json())
      .then(data => {
        setUsuarios((data?.usuarios || []).filter(u => u.activo))
      })
      .catch(() => setError('No se pudo cargar la lista de usuarios'))
      .finally(() => setCargando(false))
  }, [])

  const intentar = async (e) => {
    e.preventDefault()
    if (!selId || !password) return
    setEnviando(true)
    setError('')
    try {
      const resp = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId: selId, password }),
      })
      const data = await resp.json()
      if (!resp.ok || !data?.ok) {
        setError(data?.error || 'Usuario o contraseña incorrectos')
        setPassword('')
        return
      }
      onLogin(data.token, data.usuario)
    } catch {
      setError('No se pudo conectar con el servidor')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0e2c50 0%, #1a4a7a 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: '40px 36px', width: 360,
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ margin: '0 auto 20px', width: 140, height: 48, position: 'relative' }}>
            <Image src="/logo_dark.png" alt="Fixus" fill style={{ objectFit: 'contain' }} />
          </div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>Plataforma de gestión</div>
        </div>

        {cargando ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: '20px 0' }}>Cargando…</div>
        ) : (
          <form onSubmit={intentar}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Usuario
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8, marginBottom: 16 }}>
              {usuarios.map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => { setSelId(u.id); setPassword(''); setError('') }}
                  style={{
                    flex: '1 0 30%', padding: '10px 8px', borderRadius: 10, cursor: 'pointer',
                    border: `2px solid ${selId === u.id ? '#4a69cc' : '#e2e8f0'}`,
                    background: selId === u.id ? '#eef2ff' : '#f8fafc',
                    fontWeight: 600, fontSize: 12,
                    color: selId === u.id ? '#4a69cc' : '#64748b',
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', margin: '0 auto 6px',
                    background: selId === u.id ? 'linear-gradient(135deg, #4a69cc, #7C3AED)' : '#e2e8f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, color: selId === u.id ? '#fff' : '#94a3b8',
                  }}>{u.inicial}</div>
                  {u.nombre.split(' ')[0]}
                </button>
              ))}
            </div>

            {selId && (
              <>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="••••••••"
                  autoFocus
                  style={{
                    display: 'block', width: '100%', marginTop: 8, marginBottom: 16,
                    padding: '12px 14px', fontSize: 16, textAlign: 'center',
                    border: `2px solid ${error ? '#fca5a5' : '#e2e8f0'}`, borderRadius: 10,
                    outline: 'none', boxSizing: 'border-box', background: error ? '#fef2f2' : '#f8fafc',
                  }}
                />
              </>
            )}

            {error && (
              <div style={{ fontSize: 12, color: '#dc2626', marginBottom: 12, textAlign: 'center' }}>{error}</div>
            )}
            <button
              type="submit"
              disabled={!selId || !password || enviando}
              style={{
                width: '100%', padding: '12px', fontSize: 14, fontWeight: 700,
                background: (!selId || !password) ? '#94a3b8' : '#0e2c50', color: '#fff', border: 'none', borderRadius: 10,
                cursor: (!selId || !password) ? 'default' : 'pointer',
              }}
            >
              {enviando ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

function UsuariosAdmin({ token }) {
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [editando, setEditando] = useState(null) // usuario o null; {} para alta nueva
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const cargar = useCallback(() => {
    setCargando(true)
    fetch('/api/usuarios')
      .then(r => r.json())
      .then(data => setUsuarios(data?.usuarios || []))
      .catch(() => setError('No se pudo cargar la lista de usuarios'))
      .finally(() => setCargando(false))
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const guardar = async (form) => {
    setGuardando(true)
    setError('')
    try {
      const resp = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      })
      const data = await resp.json()
      if (!resp.ok || !data?.ok) {
        setError(data?.error || 'No se pudo guardar')
        return
      }
      setEditando(null)
      cargar()
    } catch {
      setError('No se pudo conectar con el servidor')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0e2c50' }}>Usuarios</div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
            Alta y edición de usuarios del sistema (dueños y productores)
          </div>
        </div>
        <button
          onClick={() => setEditando({ nuevo: true })}
          style={{
            background: '#0e2c50', color: '#fff', border: 'none', borderRadius: 8,
            padding: '10px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}
        >
          + Nuevo usuario
        </button>
      </div>

      {error && <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 16 }}>{error}</div>}

      {cargando ? (
        <div style={{ color: '#94a3b8', fontSize: 13 }}>Cargando…</div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          {usuarios.map(u => (
            <div key={u.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
              borderBottom: '1px solid #f1f5f9',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', background: '#eef2ff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: '#4a69cc', flexShrink: 0,
              }}>{u.inicial}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0e2c50' }}>{u.nombre}</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                  {u.id} · {u.rol}{!u.activo ? ' · inactivo' : ''}
                </div>
              </div>
              <button
                onClick={() => setEditando(u)}
                style={{
                  background: 'none', border: '1px solid #e2e8f0', color: '#64748b',
                  fontSize: 12, borderRadius: 6, padding: '5px 12px', cursor: 'pointer',
                }}
              >
                Editar
              </button>
            </div>
          ))}
          {usuarios.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
              Todavía no hay usuarios cargados.
            </div>
          )}
        </div>
      )}

      {editando && (
        <UsuarioForm
          usuario={editando.nuevo ? null : editando}
          guardando={guardando}
          onCancelar={() => setEditando(null)}
          onGuardar={guardar}
        />
      )}
    </div>
  )
}

function UsuarioForm({ usuario, guardando, onCancelar, onGuardar }) {
  const esNuevo = !usuario
  const [id, setId] = useState(usuario?.id || '')
  const [nombre, setNombre] = useState(usuario?.nombre || '')
  const [inicial, setInicial] = useState(usuario?.inicial || '')
  const [email, setEmail] = useState(usuario?.email || '')
  const [rol, setRol] = useState(usuario?.rol || 'productor')
  const [activo, setActivo] = useState(usuario?.activo ?? true)
  const [password, setPassword] = useState('')

  const submit = (e) => {
    e.preventDefault()
    onGuardar({
      id: id.trim(),
      nombre: nombre.trim(),
      inicial: inicial.trim().toUpperCase(),
      email: email.trim(),
      rol,
      activo,
      ...(password ? { password } : {}),
    })
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
    }}>
      <form onSubmit={submit} style={{
        background: '#fff', borderRadius: 14, padding: 28, width: 380,
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
      }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#0e2c50', marginBottom: 16 }}>
          {esNuevo ? 'Nuevo usuario' : `Editar: ${usuario.nombre}`}
        </div>

        <Campo label="Id (usuario) — ej: 'facu', 'leo', no se puede cambiar después">
          <input value={id} onChange={e => setId(e.target.value)} disabled={!esNuevo} required style={inputStyle(!esNuevo)} />
        </Campo>
        <Campo label="Nombre completo">
          <input value={nombre} onChange={e => setNombre(e.target.value)} required style={inputStyle()} />
        </Campo>
        <Campo label="Iniciales (2 letras)">
          <input value={inicial} onChange={e => setInicial(e.target.value)} maxLength={2} required style={inputStyle()} />
        </Campo>
        <Campo label="Email (opcional, para alertas)">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle()} />
        </Campo>
        <Campo label="Rol">
          <select value={rol} onChange={e => setRol(e.target.value)} style={inputStyle()}>
            <option value="productor">Productor</option>
            <option value="dueño">Dueño</option>
          </select>
        </Campo>
        <Campo label={esNuevo ? 'Contraseña inicial' : 'Nueva contraseña (dejar vacío para no cambiarla)'}>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required={esNuevo}
            style={inputStyle()}
          />
        </Campo>
        {!esNuevo && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748b', marginBottom: 16 }}>
            <input type="checkbox" checked={activo} onChange={e => setActivo(e.target.checked)} />
            Usuario activo (puede iniciar sesión)
          </label>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button type="button" onClick={onCancelar} style={{
            flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #e2e8f0',
            background: '#fff', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>Cancelar</button>
          <button type="submit" disabled={guardando} style={{
            flex: 1, padding: '10px', borderRadius: 8, border: 'none',
            background: '#0e2c50', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>{guardando ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </form>
    </div>
  )
}

function Campo({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function inputStyle(disabled = false) {
  return {
    width: '100%', padding: '10px 12px', fontSize: 14, border: '1.5px solid #e2e8f0',
    borderRadius: 8, outline: 'none', boxSizing: 'border-box',
    background: disabled ? '#f1f5f9' : '#fff', color: disabled ? '#94a3b8' : '#0e2c50',
  }
}
