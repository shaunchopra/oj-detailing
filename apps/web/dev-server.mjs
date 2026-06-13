import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_URL = process.env['API_URL'] ?? 'http://localhost:3001';

const app = express();

app.use(createProxyMiddleware({
  target: API_URL,
  changeOrigin: true,
  pathFilter: '/api/**',
}));

app.use(express.static(__dirname));

const PORT = Number(process.env['PORT'] ?? 8080);
app.listen(PORT, () => {
  console.log(`Web dev server listening on http://localhost:${PORT}`);
  console.log(`Proxying /api/* → ${API_URL}`);
});
