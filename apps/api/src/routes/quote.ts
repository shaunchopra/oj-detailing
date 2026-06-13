import { Router, Request, Response } from 'express';
import { handleQuoteRequest } from '../services/quote.js';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const result = await handleQuoteRequest(req.body ?? {});

  if ('success' in result) {
    return res.status(200).json({ success: true });
  }

  return res.status(result.status).json({ success: false, error: result.error });
});

export default router;
