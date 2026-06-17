import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import quoteRouter from './routes/quote.js';
import { posthog } from './lib/posthog.js';

function getAllowedOrigins(): string[] {
  const origins = new Set([
    'https://oj-auto-detailing.com.au',
    'https://www.oj-auto-detailing.com.au',
    'http://localhost:8080',
  ]);

  const cloudfrontOrigin = process.env['CLOUDFRONT_ORIGIN']?.trim();
  if (cloudfrontOrigin) {
    origins.add(cloudfrontOrigin);
  }

  const extra = process.env['ALLOWED_ORIGINS'];
  if (extra) {
    for (const origin of extra.split(',')) {
      const trimmed = origin.trim();
      if (trimmed) {
        origins.add(trimmed);
      }
    }
  }

  return [...origins];
}

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

export const app = express();

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
    const allowedOrigins = getAllowedOrigins();
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
  posthog.captureException(err instanceof Error ? err : new Error(String(err)), 'server');
  if (isProduction) {
    console.error('[api] unhandled error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }

  const message = err instanceof Error ? err.message : 'Internal server error.';
  return res.status(500).json({ success: false, error: message });
});
