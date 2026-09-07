import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

import { SERVICES, ADDONS } from "../data/pricing.js";
import { coerceStringArray } from "../lib/utils.js";
import { sendQuoteEmail, sendDynamoFailureAlert } from "./mailer.js";
import { QuotePayload, ResolvedQuote } from "../types/index.js";
import { QuoteRequestInput } from "../schemas/quote.js";
import { posthog } from "../lib/posthog.js";
import { QUOTES_TABLE } from "../constants.js";

export type QuoteError = { status: number; error: string };
export const dynamoClient = new DynamoDBClient({});
export const docClient = DynamoDBDocumentClient.from(dynamoClient);
export type QuoteSuccess = { success: true };
export type QuoteResult = QuoteSuccess | QuoteError;

function toQuotePayload(input: QuoteRequestInput): QuotePayload {
  return {
    service: input.service,
    name: input.name,
    phone: input.phone,
    email: input.email,
    suburb: input.suburb,
    addons: input.addons,
    vehicle_model: input.vehicle_model,
    notes: input.notes,
    company: input.company,
    terms_accepted: true,
  };
}

function resolveQuote(payload: QuotePayload): ResolvedQuote {
  const serviceData = SERVICES[payload.service]!;
  const basePrice = serviceData.price;

  const addonValues = coerceStringArray(payload.addons);
  const selectedAddons = addonValues.flatMap((v) =>
    ADDONS[v] ? [ADDONS[v]!] : [],
  );
  const estimatedTotal =
    basePrice + selectedAddons.reduce((sum, a) => sum + a.price, 0);

  return { payload, serviceData, selectedAddons, basePrice, estimatedTotal };
}

export async function handleQuoteRequest(
  input: QuoteRequestInput,
): Promise<QuoteResult> {
  let quote: ResolvedQuote;
  try {
    quote = resolveQuote(toQuotePayload(input));
  } catch (e) {
    const status = (e as { status?: number }).status ?? 400;
    const message = e instanceof Error ? e.message : "Bad request.";
    return { status, error: message };
  }

  try {
    const item = {
      quoteId: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...quote.payload,
      selectedAddons: quote.selectedAddons,
      basePrice: quote.basePrice,
      estimatedTotal: quote.estimatedTotal,
    };
    await docClient.send(
      new PutCommand({
        TableName: QUOTES_TABLE,
        Item: item,
      }),
    );
  } catch (error) {
    console.error("DynamoDB write failed:", error);
    throw error
  }

  try {
    await sendQuoteEmail(quote);
    posthog.capture({
      distinctId: quote.payload.email,
      event: "quote_email_sent",
      properties: {
        service: quote.payload.service,
        addon_count: quote.selectedAddons.length,
        estimated_total: quote.estimatedTotal,
      },
    });
    return { success: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[quote] email send error:", message);
    posthog.capture({
      distinctId: quote.payload.email,
      event: "quote_email_failed",
      properties: {
        service: quote.payload.service,
        error_message: message,
      },
    });
    return {
      status: 500,
      error: "Failed to send \u2014 please try again or call us directly.",
    };
  }
}
