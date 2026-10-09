// Etapa 3 del plan de unificación — alta de usuarios gestionable.
//
// Proxy server-to-server hacia fixus-cobros (dueño de la entidad Usuario).
// El navegador nunca conoce PORTAL_SECRET ni AUTH_SECRET.
//
// GET  -> lista de usuarios (sin passwordHash) — la usa la pantalla de login
//         (elegir quién entra) y, filtrada en el cliente, la de alta.
// POST -> crear/editar un usuario — exige un token de sesión vigente con rol
//         'dueño' (Authorization: Bearer <token>, el mismo que devuelve
//         /api/login), verificado acá con AUTH_SECRET antes de reenviar.

import { verifySession } from 'fixus-afip'

export default async function handler(req, res) {
  const cobrosUrl = process.env.FIXUS_COBROS_URL
  const portalSecret = process.env.PORTAL_SECRET
  if (!cobrosUrl || !portalSecret) {
    return res.status(500).json({ error: 'FIXUS_COBROS_URL o PORTAL_SECRET no configurados en este proyecto' })
  }

  if (req.method === 'GET') {
    try {
      const resp = await fetch(`${cobrosUrl.replace(/\/$/, '')}/api/admin/usuarios`, {
        headers: { Authorization: `Bearer ${portalSecret}` },
      })
      const data = await resp.json().catch(() => null)
      return res.status(resp.status).json(data)
    } catch (err) {
      console.error('usuarios proxy (GET) error:', err)
      return res.status(502).json({ error: 'No se pudo contactar a fixus-cobros' })
    }
  }

  if (req.method === 'POST') {
    const authSecret = process.env.AUTH_SECRET
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
    const sesion = verifySession(token, authSecret)
    if (!sesion || sesion.rol !== 'dueño') {
      return res.status(403).json({ error: 'Solo un usuario con rol dueño puede dar de alta o editar usuarios' })
    }
    try {
      const resp = await fetch(`${cobrosUrl.replace(/\/$/, '')}/api/admin/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${portalSecret}` },
        body: JSON.stringify(req.body),
      })
      const data = await resp.json().catch(() => null)
      return res.status(resp.status).json(data)
    } catch (err) {
      console.error('usuarios proxy (POST) error:', err)
      return res.status(502).json({ error: 'No se pudo contactar a fixus-cobros' })
    }
  }

  return res.status(405).json({ error: 'Método no permitido' })
}
