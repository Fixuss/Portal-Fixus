// Etapa 3 del plan de unificación — login único.
//
// Proxy server-to-server hacia el endpoint de login de fixus-cobros (dueño
// de la entidad Usuario). El navegador nunca conoce PORTAL_SECRET — lo
// agrega este endpoint, que corre en el servidor del Portal.

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

  try {
    const resp = await fetch(`${cobrosUrl.replace(/\/$/, '')}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${portalSecret}` },
      body: JSON.stringify({ usuarioId, password }),
    })
    const data = await resp.json().catch(() => null)
    return res.status(resp.status).json(data)
  } catch (err) {
    console.error('login proxy error:', err)
    return res.status(502).json({ error: 'No se pudo contactar a fixus-cobros' })
  }
}
