import http from 'http';

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default function handler(req, res) {
  const targetHost = 'affilliance.runasp.net';

  // req.query.path is an array like ['Account', 'login'] for /api/Account/login
  let pathSegments = req.query.path || [];
  if (!Array.isArray(pathSegments)) {
    pathSegments = [pathSegments];
  }

  // Build: /api/Account/login
  const apiPath = '/api/' + pathSegments.join('/');

  // Reconstruct query string (excluding the internal 'path' param)
  const queryParts = [];
  for (const key in req.query) {
    if (key !== 'path') {
      const val = req.query[key];
      if (Array.isArray(val)) {
        val.forEach(v => queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`));
      } else {
        queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`);
      }
    }
  }

  const fullPath = queryParts.length > 0 ? `${apiPath}?${queryParts.join('&')}` : apiPath;

  const options = {
    hostname: targetHost,
    port: 80,
    path: fullPath,
    method: req.method,
    headers: { ...req.headers },
  };

  options.headers.host = targetHost;

  // Remove hop-by-hop headers that shouldn't be forwarded
  delete options.headers.connection;
  delete options.headers.referer;
  delete options.headers['x-forwarded-host'];
  delete options.headers['x-forwarded-proto'];
  delete options.headers['x-forwarded-for'];
  delete options.headers['x-vercel-forwarded-for'];
  delete options.headers['x-real-ip'];

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err);
    if (!res.headersSent) {
      res.status(502).json({ error: 'Bad Gateway', details: err.message });
    }
  });

  req.pipe(proxyReq, { end: true });
}
