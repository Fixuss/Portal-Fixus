// ENDPOINT TEMPORAL DE DIAGNÓSTICO — borrar después de verificar Etapa 3.
// Devuelve un hash corto (NO el secreto real) de AUTH_SECRET y
// PORTAL_SECRET para comparar que coinciden entre apps, sin exponerlos.

import { createHash } from 'crypto'

function huella(valor) {
  if (!valor) return null
  return createHash('sha256').update(valor).digest('hex').slice(0, 12)
}

export default function handler(req, res) {
  return res.status(200).json({
    app: 'portal-fixus',
    AUTH_SECRET_huella: huella(process.env.AUTH_SECRET),
    PORTAL_SECRET_huella: huella(process.env.PORTAL_SECRET),
  })
}
