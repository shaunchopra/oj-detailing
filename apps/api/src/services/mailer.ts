import nodemailer from 'nodemailer';
import { ResolvedQuote } from '../types/index.js';
import { RECIPIENT } from '../data/pricing.js';
import { buildEmailSubject, buildEmailText, buildEmailHtml } from '../templates/quoteEmail.js';

export async function sendQuoteEmail(quote: ResolvedQuote): Promise<void> {
  const { payload } = quote;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env['GMAIL_USER'],
      pass: process.env['GMAIL_APP_PASSWORD'],
    },
  });

  await transporter.sendMail({
    from:    `"OJ Auto Detailing" <${process.env['GMAIL_USER']}>`,
    to:      RECIPIENT,
    replyTo: `${payload.name} <${payload.email}>`,
    subject: buildEmailSubject(quote),
    text:    buildEmailText(quote),
    html:    buildEmailHtml(quote),
  });
}
