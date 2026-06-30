import { useState, useEffect } from 'react'
import Image from 'next/image'

const USUARIOS = [
  { id: 'facu', nombre: 'Facundo Vallina',      inicial: 'FV', pin: '1111' },
  { id: 'leo',  nombre: 'Leonardo Evangelista', inicial: 'LE', pin: '2222' },
]

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

const SESSION_KEY = 'fixus_portal_user'

export default function Portal() {
  const [usuario, setUsuario] = useState(null)
  const [pin, setPin]         = useState('')
  const [error, setError]     = useState('')
  const [ready, setReady]     = useState(false)

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY)
    if (saved) setUsuario(saved)
    setReady(true)
  }, [])

  const handleLogin = (e) => {
    e.preventDefault()
    const u = USUARIOS.find(x => x.pin === pin.trim())
    if (!u) { setError('PIN incorrecto'); return }
    sessionStorage.setItem(SESSION_KEY, u.id)
    setUsuario(u.id)
    setPin('')
    setError('')
  }

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY)
    setUsuario(null)
  }

  const u = USUARIOS.find(x => x.id === usuario)

  if (!ready) return null

  if (!usuario) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #0e2c50 0%, #1a4a7a 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}>
        <div style={{
          background: '#fff', borderRadius: 16, padding: '40px 36px', width: 340,
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ margin: '0 auto 20px', width: 140, height: 48, position: 'relative' }}>
              <Image src="/logo_dark.png" alt="Fixus" fill style={{ objectFit: 'contain' }} />
            </div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>Plataforma de gestión</div>
          </div>

          <form onSubmit={handleLogin}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              PIN de acceso
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={e => { setPin(e.target.value); setError('') }}
              placeholder="····"
              autoFocus
              style={{
                display: 'block', width: '100%', marginTop: 8, marginBottom: 16,
                padding: '12px 14px', fontSize: 22, letterSpacing: '0.4em', textAlign: 'center',
                border: `2px solid ${error ? '#fca5a5' : '#e2e8f0'}`, borderRadius: 10,
                outline: 'none', boxSizing: 'border-box', background: error ? '#fef2f2' : '#f8fafc',
              }}
            />
            {error && (
              <div style={{ fontSize: 12, color: '#dc2626', marginBottom: 12, textAlign: 'center' }}>{error}</div>
            )}
            <button type="submit" style={{
              width: '100%', padding: '12px', fontSize: 14, fontWeight: 700,
              background: '#0e2c50', color: '#fff', border: 'none', borderRadius: 10,
              cursor: 'pointer',
            }}>
              Ingresar
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f1f5f9',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0e2c50 0%, #1a4a7a 100%)',
        padding: '0 32px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ position: 'relative', width: 100, height: 32 }}>
          <Image src="/logo_white.png" alt="Fixus" fill style={{ objectFit: 'contain', objectPosition: 'left' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: '#fff',
          }}>{u?.inicial}</div>
          <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>{u?.nombre}</span>
          <button onClick={handleLogout} style={{
            background: 'none', border: '1px solid rgba(255,255,255,0.25)',
            color: 'rgba(255,255,255,0.6)', fontSize: 11, borderRadius: 6,
            padding: '3px 10px', cursor: 'pointer',
          }}>Salir</button>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#0e2c50', letterSpacing: '-0.5px' }}>
            Buen día, {u?.nombre.split(' ')[0]}
          </div>
          <div style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>
            Seleccioná la herramienta que querés usar
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, alignItems: 'stretch' }}>
          {APPS.map(app => (
            <a
              key={app.id}
              href={app.url}
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
      </div>
    </div>
  )
}
