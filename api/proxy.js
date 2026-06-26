import http from 'http';

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default function handler(req, res) {
  let targetPath = req.url;
  
  if (req.query && req.query.target) {
    const queryParts = [];
    for (const key in req.query) {
      if (key !== 'target') {
        const val = req.query[key];
        if (Array.isArray(val)) {
          val.forEach(v => queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`));
        } else {
          queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`);
        }
      }
    }
    const qs = queryParts.join('&');
    targetPath = qs ? `${req.query.target}?${qs}` : req.query.target;
  }

  const targetHost = 'affilliance.runasp.net';
  
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
