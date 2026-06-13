import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SERVICES, ADDONS } from '../data/pricing.js';
import { ok, err, preflight } from '../lib/response.js';
import { isValidEmail, coerceStringArray } from '../lib/utils.js';
import { sendQuoteEmail } from '../services/mailer.js';
import { QuotePayload, ResolvedQuote } from '../types/index.js';

function parseBody(event: APIGatewayProxyEvent): Record<string, unknown> {
  try {
    return JSON.parse(event.body ?? '{}');
  } catch {
    throw new Error('Invalid JSON payload.');
  }
}

function validate(raw: Record<string, unknown>): QuotePayload {
  const vehicleType = String(raw['vehicle_type'] ?? '').trim();
  const service     = String(raw['service']      ?? '').trim();
  const name        = String(raw['name']         ?? '').trim();
  const phone       = String(raw['phone']        ?? '').trim();
  const email       = String(raw['email']        ?? '').trim();

  if (!vehicleType || !service || !name || !phone || !email) {
    throw Object.assign(new Error('Required fields are missing.'), { status: 400 });
  }
  if (!['car', 'caravan'].includes(vehicleType)) {
    throw Object.assign(new Error('Invalid vehicle type.'), { status: 400 });
  }
  if (!(service in SERVICES)) {
    throw Object.assign(new Error('Invalid service selection.'), { status: 400 });
  }
  if (!isValidEmail(email)) {
    throw Object.assign(new Error('Invalid email address.'), { status: 400 });
  }

  return {
    vehicle_type:   vehicleType as QuotePayload['vehicle_type'],
    service,
    name,
    phone,
    email,
    addons:         raw['addons'] as string | string[] | undefined,
    vehicle_model:  raw['vehicle_model']  ? String(raw['vehicle_model']).trim()  : undefined,
    preferred_date: raw['preferred_date'] ? String(raw['preferred_date']).trim() : undefined,
    notes:          raw['notes']          ? String(raw['notes']).trim()          : undefined,
    company:        raw['company']        ? String(raw['company']).trim()        : undefined,
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
  const selectedAddons = addonValues.flatMap(v => (ADDONS[v] ? [ADDONS[v]!] : []));
  const estimatedTotal = basePrice + selectedAddons.reduce((sum, a) => sum + a.price, 0);

  return { payload, serviceData, selectedAddons, basePrice, estimatedTotal, isCaravan };
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'POST')    return err(405, 'Method not allowed.');

  let raw: Record<string, unknown>;
  try {
    raw = parseBody(event);
  } catch {
    return err(400, 'Invalid JSON payload.');
  }

  // Silently swallow bot submissions
  if (raw['company'] && String(raw['company']).trim() !== '') {
    return ok({ success: true });
  }

  let quote: ResolvedQuote;
  try {
    const payload = validate(raw);
    quote = resolveQuote(payload);
  } catch (e) {
    const status  = (e as { status?: number }).status ?? 400;
    const message = e instanceof Error ? e.message : 'Bad request.';
    return err(status, message);
  }

  try {
    await sendQuoteEmail(quote);
    return ok({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('[quote] email send error:', message);
    return err(500, 'Failed to send \u2014 please try again or call us directly.');
  }
};
