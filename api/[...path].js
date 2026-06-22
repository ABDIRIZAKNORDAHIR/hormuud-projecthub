/**
 * Vercel serverless proxy: /api/* → Render backend (API + PostgreSQL database).
 * Set RENDER_API_URL in Vercel → e.g. https://hormuud-projecthub.onrender.com
 */
const DEFAULT_RENDER = 'https://hormuud-projecthub.onrender.com';

export default async function handler(req, res) {
  const base = (process.env.RENDER_API_URL || process.env.API_URL || DEFAULT_RENDER).replace(/\/$/, '');
  const segments = req.query.path;
  const path = Array.isArray(segments) ? segments.join('/') : segments || '';
  const qs = req.url?.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  const target = `${base}/api/${path}${qs}`;

  const headers = { Accept: 'application/json' };
  if (req.headers.authorization) headers.Authorization = req.headers.authorization;
  if (req.headers['content-type']) headers['Content-Type'] = req.headers['content-type'];

  const init = { method: req.method, headers };
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.body !== undefined) {
    init.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  }

  try {
    const upstream = await fetch(target, init);
    const text = await upstream.text();
    const contentType = upstream.headers.get('content-type');
    if (contentType) res.setHeader('Content-Type', contentType);
    res.status(upstream.status).send(text);
  } catch (err) {
    res.status(502).json({
      status: 'error',
      service: 'ProjectHub API Proxy',
      database: 'unreachable',
      error: 'Cannot reach Render API. Deploy backend on Render and set DATABASE_URL (Supabase).',
      details: err?.message || String(err),
    });
  }
}
