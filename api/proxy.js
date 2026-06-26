import http from 'http';

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default function handler(req, res) {
  const targetHost = 'affilliance.runasp.net';
  
  let targetPath = req.query.path || '';
  if (Array.isArray(targetPath)) {
    targetPath = targetPath.join('/');
  }
  
  if (req.query.prefix) {
    targetPath = `/${req.query.prefix}/${targetPath}`;
  } else {
    targetPath = `/${targetPath}`;
  }
  
  // Reconstruct query parameters (excluding 'path' and 'prefix')
  const queryParts = [];
  for (const key in req.query) {
    if (key !== 'path' && key !== 'prefix') {
      const val = req.query[key];
      if (Array.isArray(val)) {
        val.forEach(v => queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`));
      } else {
        queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`);
      }
    }
  }
  
  if (queryParts.length > 0) {
    targetPath += `?${queryParts.join('&')}`;
  }
  
  const options = {
    hostname: targetHost,
    port: 80,
    path: targetPath,
    method: req.method,
    headers: { ...req.headers },
  };

  options.headers.host = targetHost;
  
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
