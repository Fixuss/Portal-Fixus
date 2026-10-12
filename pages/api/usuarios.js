// Etapa 3 del plan de unificación (alta de usuarios) — restringido en la
// Etapa 7 (revisión de seguridad, 12-oct-2026).
//
// Este endpoint es público (sin login) porque lo usa la pantalla de login
// para mostrar el selector de "quién entra" — por eso ahora SOLO expone lo
// mínimo necesario para eso: id, nombre e inicial de usuarios activos. Antes
// devolvía también email, rol y el estado activo/inactivo de TODO el
// padrón, sin ningún control — eso quedó movido a /api/usuarios-admin.js,
// que exige sesión de un usuario con rol 'dueño'.
//
// Reutiliza el directorio de solo-lectura que fixus-cobros ya expone para
// las demás apps (protegido con AUTH_SECRET, nunca llega al navegador) y
// recorta la respuesta antes de devolverla.

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  const cobrosUrl = process.env.FIXUS_COBROS_URL
  const authSecret = process.env.AUTH_SECRET
  if (!cobrosUrl || !authSecret) {
    return res.status(500).json({ error: 'FIXUS_COBROS_URL o AUTH_SECRET no configurados en este proyecto' })
  }

  try {
    const resp = await fetch(`${cobrosUrl.replace(/\/$/, '')}/api/usuarios-directorio`, {
      headers: { Authorization: `Bearer ${authSecret}` },
    })
    const data = await resp.json().catch(() => null)
    if (!resp.ok || !data?.ok) {
      return res.status(resp.status).json({ error: 'No se pudo cargar la lista de usuarios' })
    }
    const usuarios = (data.usuarios || []).map(u => ({ id: u.id, nombre: u.nombre, inicial: u.inicial }))
    return res.status(200).json({ ok: true, usuarios })
  } catch (err) {
    console.error('usuarios (GET) error:', err)
    return res.status(502).json({ error: 'No se pudo contactar a fixus-cobros' })
  }
}
