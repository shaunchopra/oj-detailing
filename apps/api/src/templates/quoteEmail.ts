import { ResolvedQuote } from '../types/index.js';
import { esc, stripControlChars } from '../lib/utils.js';

export function buildEmailSubject(quote: ResolvedQuote): string {
  const { payload, serviceData } = quote;
  const safeName = stripControlChars(payload.name);
  const stage = process.env['STAGE']?.trim() || 'prod';
  const prefix = stage === 'prod' ? '' : `[${stage.toUpperCase()}] `;
  return `${prefix}New quote request, ${safeName}, ${serviceData.label}`;
}

export function buildEmailText(quote: ResolvedQuote): string {
  const { payload, serviceData, selectedAddons, basePrice, estimatedTotal } = quote;

  const lines: string[] = [
    'New quote request from the OJ Auto Detailing website',
    '',
    '--- SERVICE ---',
    `Service      : ${serviceData.label} (from $${basePrice})`,
  ];

  if (selectedAddons.length > 0) {
    lines.push('', '--- ADD ONS ---');
    for (const addon of selectedAddons) {
      lines.push(`${addon.label} : from $${addon.price}`);
    }
  }

  lines.push(
    '',
    `Estimated total : from $${estimatedTotal}`,
    '',
    '--- CUSTOMER ---',
    `Full name      : ${payload.name}`,
    `Phone          : ${payload.phone}`,
    `Suburb         : ${payload.suburb}`,
    `Email          : ${payload.email}`,
    `Terms accepted : Yes`,
  );

  if (payload.vehicle_model)  lines.push(`Make & model   : ${payload.vehicle_model}`);
  if (payload.notes)          lines.push('', 'Notes:', payload.notes);

  return lines.join('\n');
}

export function buildEmailHtml(quote: ResolvedQuote): string {
  const { payload, serviceData, selectedAddons, basePrice, estimatedTotal } = quote;

  const addonRows = selectedAddons
    .map(a => `<tr><td class="label">${esc(a.label)}</td><td>from $${a.price}</td></tr>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{margin:0;padding:0;background:#f4f4f2;font-family:system-ui,-apple-system,sans-serif;color:#1a1a1a}
  .wrap{max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;margin-top:24px;margin-bottom:24px}
  .header{background:#09090b;padding:28px 32px}
  .header h1{margin:0;font-size:1.125rem;color:#e4e4e4;font-weight:600}
  .header p{margin:4px 0 0;font-size:0.8125rem;color:#888}
  .body{padding:28px 32px}
  h2{font-size:0.6875rem;letter-spacing:0.1em;text-transform:uppercase;color:#888;margin:24px 0 10px;padding-bottom:6px;border-bottom:1px solid #e5e5e5}
  h2:first-child{margin-top:0}
  table{width:100%;border-collapse:collapse;font-size:0.9375rem}
  td{padding:5px 0;vertical-align:top}
  td.label{color:#666;width:40%;padding-right:16px}
  .total{font-size:1.5rem;font-weight:700;color:#1a78b2;margin:4px 0 0}
  .notes{background:#f8f8f6;border-left:3px solid #d4d4d4;padding:12px 16px;font-size:0.9rem;white-space:pre-wrap;border-radius:0 4px 4px 0;margin-top:8px}
  .footer{background:#f8f8f6;padding:16px 32px;font-size:0.75rem;color:#999;border-top:1px solid #e5e5e5}
  a{color:#1a78b2}
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <h1>New quote request</h1>
    <p>OJ Auto Detailing, submitted via the website</p>
  </div>
  <div class="body">

    <h2>Service</h2>
    <table>
      <tr><td class="label">Service</td><td><strong>${esc(serviceData.label)}</strong>, from $${basePrice}</td></tr>
    </table>

    ${selectedAddons.length > 0 ? `
    <h2>Add ons</h2>
    <table>${addonRows}</table>
    ` : ''}

    <h2>Estimated total</h2>
    <p class="total">from $${estimatedTotal}</p>

    <h2>Customer</h2>
    <table>
      <tr><td class="label">Full name</td><td><strong>${esc(payload.name)}</strong></td></tr>
      <tr><td class="label">Phone</td><td><a href="tel:${esc(payload.phone)}">${esc(payload.phone)}</a></td></tr>
      <tr><td class="label">Suburb</td><td>${esc(payload.suburb)}</td></tr>
      <tr><td class="label">Email</td><td><a href="mailto:${esc(payload.email)}">${esc(payload.email)}</a></td></tr>
      ${payload.vehicle_model  ? `<tr><td class="label">Make &amp; model</td><td>${esc(payload.vehicle_model)}</td></tr>`  : ''}
      <tr><td class="label">Terms accepted</td><td>Yes</td></tr>
    </table>

    ${payload.notes ? `
    <h2>Notes</h2>
    <div class="notes">${esc(payload.notes)}</div>
    ` : ''}

  </div>
  <div class="footer">This email was sent automatically when a visitor submitted the quote form.</div>
</div>
</body>
</html>`;
}
