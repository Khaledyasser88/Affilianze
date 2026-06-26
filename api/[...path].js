import http from 'http';

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default function handler(req, res) {
  const targetHost = 'affilliance.runasp.net';
  
  const options = {
    hostname: targetHost,
    port: 80,
    path: req.url, // e.g. /api/auth/login
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
