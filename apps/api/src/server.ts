import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import quoteRouter from './routes/quote.js';

const app = express();
const PORT = Number(process.env['PORT'] ?? 3001);

app.use(cors({
  origin: '*',
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());
app.use('/api/quote', quoteRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ success: false, error: 'Invalid JSON payload.' });
  }
  next(err);
});

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
