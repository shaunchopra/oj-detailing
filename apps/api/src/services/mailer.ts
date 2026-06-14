import { Resend } from 'resend';
import { ResolvedQuote } from '../types/index.js';
import { RECIPIENT } from '../data/pricing.js';
import { formatReplyTo } from '../lib/utils.js';
import { buildEmailSubject, buildEmailText, buildEmailHtml } from '../templates/quoteEmail.js';

function getResend(): Resend {
  const apiKey = process.env['RESEND_API_KEY'];
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured.');
  }
  return new Resend(apiKey);
}

function getFromAddress(): string {
  const from = process.env['RESEND_FROM']?.trim();
  if (!from) {
    throw new Error('RESEND_FROM is not configured.');
  }
  return from;
}

export async function sendQuoteEmail(quote: ResolvedQuote): Promise<void> {
  const { payload } = quote;

  const { error } = await getResend().emails.send({
    from:    getFromAddress(),
    to:      [RECIPIENT],
    replyTo: formatReplyTo(payload.name, payload.email),
    subject: buildEmailSubject(quote),
    text:    buildEmailText(quote),
    html:    buildEmailHtml(quote),
  });

  if (error) {
    throw new Error(error.message);
  }
}
