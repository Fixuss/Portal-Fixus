// Etapa 7 (revisión de seguridad, 12-oct-2026) — endpoint ADMINISTRATIVO,
// separado de /api/usuarios.
//
// Antes, /api/usuarios devolvía la lista completa (nombre/email/rol/activo
// de todos los usuarios, activos e inactivos) sin ningún control — cualquiera
// que conociera la URL podía ver el padrón completo del equipo. Ese endpoint
// ahora solo expone lo mínimo para el selector de login (ver pages/api/usuarios.js).
// Este endpoint nuevo tiene los datos completos, y exige sesión vigente con
// rol 'dueño' tanto para listar como para dar de alta/editar — antes esa
// exigencia solo se aplicaba al POST, nunca al GET.

import { verifySession } from 'fixus-afip'

function sesionDueño(req) {
  const authSecret = process.env.AUTH_SECRET
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  const sesion = verifySession(token, authSecret)
  if (!sesion || sesion.rol !== 'dueño') return null
  return sesion
}

export default async function handler(req, res) {
  const cobrosUrl = process.env.FIXUS_COBROS_URL
  const portalSecret = process.env.PORTAL_SECRET
  if (!cobrosUrl || !portalSecret) {
    return res.status(500).json({ error: 'FIXUS_COBROS_URL o PORTAL_SECRET no configurados en este proyecto' })
  }

  if (!sesionDueño(req)) {
    return res.status(403).json({ error: 'Solo un usuario con rol dueño puede ver o editar usuarios' })
  }

  if (req.method === 'GET') {
    try {
      const resp = await fetch(`${cobrosUrl.replace(/\/$/, '')}/api/admin/usuarios`, {
        headers: { Authorization: `Bearer ${portalSecret}` },
      })
      const data = await resp.json().catch(() => null)
      return res.status(resp.status).json(data)
    } catch (err) {
      console.error('usuarios-admin proxy (GET) error:', err)
      return res.status(502).json({ error: 'No se pudo contactar a fixus-cobros' })
    }
  }

  if (req.method === 'POST') {
    try {
      const resp = await fetch(`${cobrosUrl.replace(/\/$/, '')}/api/admin/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${portalSecret}` },
        body: JSON.stringify(req.body),
      })
      const data = await resp.json().catch(() => null)
      return res.status(resp.status).json(data)
    } catch (err) {
      console.error('usuarios-admin proxy (POST) error:', err)
      return res.status(502).json({ error: 'No se pudo contactar a fixus-cobros' })
    }
  }

  return res.status(405).json({ error: 'Método no permitido' })
}
