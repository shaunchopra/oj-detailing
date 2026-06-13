// api/quote.js — Vercel serverless function
// POST /api/quote — validates the quote form payload and emails it to Julian.
// Env vars required:  GMAIL_USER, GMAIL_APP_PASSWORD

'use strict';

const nodemailer = require('nodemailer');

// ── Mirrors PRICING in js/script.js — single authoritative copy on the server ──
const SERVICES = {
  'touch-up':         { label: 'Touch Up',                  car: 80,  caravan: null },
  'tier-1-exterior':  { label: 'Tier 1 \u2014 Exterior',    car: 65,  caravan: 200  },
  'tier-2-interior':  { label: 'Tier 2 \u2014 Interior',    car: 150, caravan: 320  },
  'tier-3-complete':  { label: 'Tier 3 \u2014 Complete Detail', car: 200, caravan: 495 },
};

const ADDONS = {
  'scratch-removal':       { label: 'Scratch removal',       price: 45  },
  'trim-restoration':      { label: 'Trim restoration',      price: 50  },
  'water-repellent':       { label: 'Water repellent',       price: 30  },
  'anti-fog':              { label: 'Anti-fog',              price: 35  },
  'headlight-restoration': { label: 'Headlight restoration', price: 100 },
};

const RECIPIENT = 'ojdservice1@gmail.com';

// ── Helpers ──────────────────────────────────────────────────────────────────

function isValidEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

// Minimal HTML-entity escape for user-supplied strings in the HTML email body
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Handler ──────────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  // Only POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed.' });
  }

  // Parse body — Vercel auto-parses application/json, but guard against raw strings
  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  } catch {
    return res.status(400).json({ success: false, error: 'Invalid JSON payload.' });
  }

  // ── Honeypot: silently accept bot submissions without sending ──
  if (body.company && String(body.company).trim() !== '') {
    return res.status(200).json({ success: true });
  }

  // ── Server-side validation ────────────────────────────────────────────────
  const vehicleType = String(body.vehicle_type || '').trim();
  const service     = String(body.service      || '').trim();
  const name        = String(body.name         || '').trim();
  const phone       = String(body.phone        || '').trim();
  const email       = String(body.email        || '').trim();

  if (!vehicleType || !service || !name || !phone || !email) {
    return res.status(400).json({ success: false, error: 'Required fields are missing.' });
  }

  if (!['car', 'caravan'].includes(vehicleType)) {
    return res.status(400).json({ success: false, error: 'Invalid vehicle type.' });
  }

  if (!(service in SERVICES)) {
    return res.status(400).json({ success: false, error: 'Invalid service selection.' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ success: false, error: 'Invalid email address.' });
  }

  // ── Resolve service + add-ons ─────────────────────────────────────────────
  const isCaravan      = vehicleType === 'caravan';
  const serviceData    = SERVICES[service];
  const basePrice      = isCaravan ? serviceData.caravan : serviceData.car;

  // Guard: e.g. Touch Up is car-only; caravan with Touch Up is invalid
  if (basePrice === null) {
    return res.status(400).json({ success: false, error: 'That service is not available for caravans.' });
  }

  // Add-ons: accept a single string or an array; ignore unknown values
  const rawAddons     = body.addons;
  const addonValues   = Array.isArray(rawAddons)
    ? rawAddons
    : rawAddons ? [String(rawAddons)] : [];

  const selectedAddons = [];
  let addonTotal = 0;
  for (const val of addonValues) {
    const addon = ADDONS[String(val)];
    if (addon) {
      selectedAddons.push(addon);
      addonTotal += addon.price;
    }
  }

  const estimatedTotal = basePrice + addonTotal;

  // Optional fields
  const vehicleModel   = String(body.vehicle_model  || '').trim();
  const preferredDate  = String(body.preferred_date || '').trim();
  const notes          = String(body.notes          || '').trim();

  // ── Build email ───────────────────────────────────────────────────────────
  const serviceDisplay = `${serviceData.label} (from $${basePrice})`;
  const subject = `New quote request \u2014 ${name} \u2014 ${serviceData.label}${isCaravan ? ' (Caravan)' : ''}`;

  // Plain-text fallback
  const textParts = [
    'New quote request from the OJ Auto Detailing website',
    '',
    '--- SERVICE ---',
    `Vehicle type : ${isCaravan ? 'Caravan' : 'Car'}`,
    `Service      : ${serviceDisplay}`,
  ];

  if (selectedAddons.length > 0) {
    textParts.push('', '--- ADD-ONS ---');
    for (const a of selectedAddons) {
      textParts.push(`${a.label} : from $${a.price}`);
    }
  }

  textParts.push(
    '',
    `Estimated total : from $${estimatedTotal}`,
    '',
    '--- CUSTOMER ---',
    `Full name      : ${name}`,
    `Phone          : ${phone}`,
    `Email          : ${email}`,
  );
  if (vehicleModel)  textParts.push(`Make & model   : ${vehicleModel}`);
  if (preferredDate) textParts.push(`Preferred date : ${preferredDate}`);
  if (notes)         textParts.push('', 'Notes:', notes);

  const text = textParts.join('\n');

  // HTML body
  const addonRows = selectedAddons
    .map(a => `<tr><td class="label">${esc(a.label)}</td><td>from $${a.price}</td></tr>`)
    .join('');

  const html = `<!DOCTYPE html>
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
    <p>OJ Auto Detailing &mdash; submitted via the website</p>
  </div>
  <div class="body">

    <h2>Service</h2>
    <table>
      <tr><td class="label">Vehicle type</td><td>${isCaravan ? 'Caravan' : 'Car'}</td></tr>
      <tr><td class="label">Service</td><td><strong>${esc(serviceData.label)}</strong> &mdash; from $${basePrice}</td></tr>
    </table>

    ${selectedAddons.length > 0 ? `
    <h2>Add-ons</h2>
    <table>${addonRows}</table>
    ` : ''}

    <h2>Estimated total</h2>
    <p class="total">from $${estimatedTotal}</p>

    <h2>Customer</h2>
    <table>
      <tr><td class="label">Full name</td><td><strong>${esc(name)}</strong></td></tr>
      <tr><td class="label">Phone</td><td><a href="tel:${esc(phone)}">${esc(phone)}</a></td></tr>
      <tr><td class="label">Email</td><td><a href="mailto:${esc(email)}">${esc(email)}</a></td></tr>
      ${vehicleModel  ? `<tr><td class="label">Make &amp; model</td><td>${esc(vehicleModel)}</td></tr>`  : ''}
      ${preferredDate ? `<tr><td class="label">Preferred date</td><td>${esc(preferredDate)}</td></tr>` : ''}
    </table>

    ${notes ? `
    <h2>Notes</h2>
    <div class="notes">${esc(notes)}</div>
    ` : ''}

  </div>
  <div class="footer">This email was sent automatically when a visitor submitted the quote form.</div>
</div>
</body>
</html>`;

  // ── Send ──────────────────────────────────────────────────────────────────
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  try {
    await transporter.sendMail({
      from:    `"OJ Auto Detailing" <${process.env.GMAIL_USER}>`,
      to:      RECIPIENT,
      replyTo: `${name} <${email}>`,
      subject,
      text,
      html,
    });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[quote] email send error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to send — please try again or call us directly.' });
  }
};
