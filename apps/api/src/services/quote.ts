import { SERVICES, ADDONS } from '../data/pricing.js';
import { coerceStringArray } from '../lib/utils.js';
import { sendQuoteEmail } from './mailer.js';
import { QuotePayload, ResolvedQuote } from '../types/index.js';
import { QuoteRequestInput } from '../schemas/quote.js';

export type QuoteError = { status: number; error: string };
export type QuoteSuccess = { success: true };
export type QuoteResult = QuoteSuccess | QuoteError;

function toQuotePayload(input: QuoteRequestInput): QuotePayload {
  return {
    vehicle_type: input.vehicle_type,
    service: input.service,
    name: input.name,
    phone: input.phone,
    email: input.email,
    addons: input.addons,
    vehicle_model: input.vehicle_model,
    preferred_date: input.preferred_date,
    notes: input.notes,
    company: input.company,
    terms_accepted: true,
  };
}

function resolveQuote(payload: QuotePayload): ResolvedQuote {
  const isCaravan   = payload.vehicle_type === 'caravan';
  const serviceData = SERVICES[payload.service]!;
  const basePrice   = isCaravan ? serviceData.caravan : serviceData.car;

  if (basePrice === null) {
    throw Object.assign(new Error('That service is not available for caravans.'), { status: 400 });
  }

  const addonValues    = coerceStringArray(payload.addons);
  const selectedAddons = addonValues.flatMap((v) => (ADDONS[v] ? [ADDONS[v]!] : []));
  const estimatedTotal = basePrice + selectedAddons.reduce((sum, a) => sum + a.price, 0);

  return { payload, serviceData, selectedAddons, basePrice, estimatedTotal, isCaravan };
}

export async function handleQuoteRequest(input: QuoteRequestInput): Promise<QuoteResult> {
  let quote: ResolvedQuote;
  try {
    quote = resolveQuote(toQuotePayload(input));
  } catch (e) {
    const status  = (e as { status?: number }).status ?? 400;
    const message = e instanceof Error ? e.message : 'Bad request.';
    return { status, error: message };
  }

  try {
    await sendQuoteEmail(quote);
    return { success: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('[quote] email send error:', message);
    return { status: 500, error: 'Failed to send \u2014 please try again or call us directly.' };
  }
}
