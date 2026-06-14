import './env.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import quoteRouter from './routes/quote.js';

const app = express();
const PORT = Number(process.env['PORT'] ?? 3001);

const allowedOrigins = [
  'https://oj-auto-detailing.com.au',
  'https://www.oj-auto-detailing.com.au',
  'http://localhost:8080',
];

const isProduction = process.env['NODE_ENV'] === 'production';

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

const quoteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
    },
  },
  strictTransportSecurity: {
    maxAge: 31536000,
    includeSubDomains: true,
  },
  frameguard: {
    action: 'deny',
  },
}));

app.use(cors({
  origin: (origin, callback) => {
    if (origin && allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

app.use(globalLimiter);
app.use(express.json({ limit: '10kb' }));
app.use('/api/quote', quoteLimiter, quoteRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ success: false, error: 'Invalid JSON payload.' });
  }
  next(err);
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (isProduction) {
    console.error('[api] unhandled error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }

  const message = err instanceof Error ? err.message : 'Internal server error.';
  return res.status(500).json({ success: false, error: message });
});

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
