// Etapa 6 del plan de unificación — "Portal como hub real".
//
// Proxy server-to-server hacia /api/portal-resumen en fixus-cobros, mismo
// patrón que usuarios-admin.js: exige sesión vigente del Portal (cookie no,
// token Bearer que el frontend ya manda en sessionStorage — igual que
// usuarios-admin) y a partir de ahí decide qué pedir.
//
// Un 'dueño' ve todo el pipeline. Un 'productor' solo ve lo suyo (asignado
// a él, o sin asignar) — mismo criterio que usa tablero-fixus para
// productor. El filtro lo aplica fixus-cobros (?asignadoA=<id>), este
// endpoint solo decide SI lo manda, en base al rol de la sesión — nunca
// confía en un asignadoA que mande el cliente, para que un productor no
// pueda pedir los datos de otro.
//
// Deliberadamente no agrega nada de dinero (Disponible/Liquidado) — ver el
// comentario en portal-resumen/route.ts en fixus-cobros para el por qué.

import { verifySession } from 'fixus-afip'

function sesionActual(req) {
  const authSecret = process.env.AUTH_SECRET
  if (!authSecret) return null
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!token) return null
  return verifySession(token, authSecret)
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' })

  const cobrosUrl = process.env.FIXUS_COBROS_URL
  const authSecret = process.env.AUTH_SECRET
  if (!cobrosUrl || !authSecret) {
    return res.status(500).json({ error: 'FIXUS_COBROS_URL o AUTH_SECRET no configurados en este proyecto' })
  }

  const sesion = sesionActual(req)
  if (!sesion) {
    return res.status(401).json({ error: 'Sin sesión válida' })
  }

  try {
    const qs = sesion.rol === 'productor' ? `?asignadoA=${encodeURIComponent(sesion.id)}` : ''
    const resp = await fetch(`${cobrosUrl.replace(/\/$/, '')}/api/portal-resumen${qs}`, {
      headers: { Authorization: `Bearer ${authSecret}` },
    })
    const data = await resp.json().catch(() => null)
    if (!resp.ok || !data?.ok) {
      return res.status(resp.status).json({ error: 'No se pudo cargar el resumen' })
    }
    return res.status(200).json(data)
  } catch (err) {
    console.error('resumen (GET) error:', err)
    return res.status(502).json({ error: 'No se pudo contactar a fixus-cobros' })
  }
}
