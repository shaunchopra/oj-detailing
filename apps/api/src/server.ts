import './env.js';
import { app } from './app.js';

const PORT = Number(process.env['PORT'] ?? 3001);

const server = app.listen(PORT, () => {
  const addr = server.address();
  const host = typeof addr === 'object' && addr ? addr.address : 'localhost';
  const port = typeof addr === 'object' && addr ? addr.port : PORT;
  console.log(`API server listening on ${host}:${port}`);
});
