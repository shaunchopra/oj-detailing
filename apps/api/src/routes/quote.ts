import { Router, Request, Response } from 'express';
import { handleQuoteRequest } from '../services/quote.js';
import { quoteRequestSchema } from '../schemas/quote.js';
import { parseBody } from '../lib/validation.js';
import { posthog } from '../lib/posthog.js';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const body = req.body ?? {};

  if (body['company'] && String(body['company']).trim() !== '') {
    return res.status(200).json({ success: true });
  }

  const parsed = parseBody(quoteRequestSchema, body);
  if ('error' in parsed) {
    return res.status(400).json({ success: false, error: parsed.error });
  }

  posthog.capture({
    distinctId: parsed.data.email,
    event: 'quote_received',
    properties: {
      vehicle_type: parsed.data.vehicle_type,
      service: parsed.data.service,
      addon_count: Array.isArray(parsed.data.addons) ? parsed.data.addons.length : 0,
      has_preferred_date: Boolean(parsed.data.preferred_date),
    },
  });

  const result = await handleQuoteRequest(parsed.data);

  if ('success' in result) {
    return res.status(200).json({ success: true });
  }

  return res.status(result.status).json({ success: false, error: result.error });
});

export default router;
