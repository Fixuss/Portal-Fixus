// Etapa 3 del plan de unificación — login único.
//
// Proxy server-to-server hacia el endpoint de login de fixus-cobros (dueño
// de la entidad Usuario). El navegador nunca conoce PORTAL_SECRET — lo
// agrega este endpoint, que corre en el servidor del Portal.
//
// Etapa 7 (revisión de seguridad, 12-oct-2026): antes no había ningún límite
// de intentos — se podía probar contraseñas sin freno. Se agrega un límite
// simple por usuario (5 intentos fallidos cada 10 minutos, después 429).
//
// Honestidad sobre el alcance de este fix: el contador vive en memoria del
// proceso serverless (no en Redis), así que se resetea si la función se
// "enfría" o se redeploya, y no se comparte entre instancias concurrentes.
// Para un uso normal (7 usuarios, tráfico bajo) esto ya frena un intento de
// fuerza bruta sostenido — no es una garantía absoluta. Si en algún momento
// se quiere un límite más sólido, conviene llevarlo a Redis (ya disponible
// en fixus-cobros) en vez de memoria local.

const INTENTOS_MAXIMOS = 5
const VENTANA_MS = 10 * 60 * 1000 // 10 minutos

const intentosPorUsuario = new Map() // usuarioId -> { count, desde }

function bloqueado(usuarioId) {
  const entry = intentosPorUsuario.get(usuarioId)
  if (!entry) return false
  if (Date.now() - entry.desde > VENTANA_MS) {
    intentosPorUsuario.delete(usuarioId)
    return false
  }
  return entry.count >= INTENTOS_MAXIMOS
}

function registrarIntentoFallido(usuarioId) {
  const entry = intentosPorUsuario.get(usuarioId)
  if (!entry || Date.now() - entry.desde > VENTANA_MS) {
    intentosPorUsuario.set(usuarioId, { count: 1, desde: Date.now() })
  } else {
    entry.count += 1
  }
}

function limpiarIntentos(usuarioId) {
  intentosPorUsuario.delete(usuarioId)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' })

  const cobrosUrl = process.env.FIXUS_COBROS_URL
  const portalSecret = process.env.PORTAL_SECRET
  if (!cobrosUrl || !portalSecret) {
    return res.status(500).json({ error: 'FIXUS_COBROS_URL o PORTAL_SECRET no configurados en este proyecto' })
  }

  const { usuarioId, password } = req.body || {}
  if (!usuarioId || !password) {
    return res.status(400).json({ error: 'Faltan usuarioId o password' })
  }

  if (bloqueado(usuarioId)) {
    return res.status(429).json({ error: 'Demasiados intentos fallidos. Probá de nuevo en unos minutos.' })
  }

  try {
    const resp = await fetch(`${cobrosUrl.replace(/\/$/, '')}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${portalSecret}` },
      body: JSON.stringify({ usuarioId, password }),
    })
    const data = await resp.json().catch(() => null)

    if (resp.ok && data?.ok) {
      limpiarIntentos(usuarioId)
    } else {
      registrarIntentoFallido(usuarioId)
    }

    return res.status(resp.status).json(data)
  } catch (err) {
    console.error('login proxy error:', err)
    return res.status(502).json({ error: 'No se pudo contactar a fixus-cobros' })
  }
}
