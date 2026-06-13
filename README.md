# OJ Auto Detailing

Static marketing site + serverless quote-request function for [OJ Auto Detailing](https://ojautodetailing.com.au), Melbourne VIC.

## Quote form — email setup

The `/api/quote` endpoint sends quote requests to Julian via Gmail SMTP using [Nodemailer](https://nodemailer.com). It requires two environment variables:

| Variable            | Description                                                  |
| ------------------- | ------------------------------------------------------------ |
| `GMAIL_USER`        | The Gmail address that sends the email (e.g. `you@gmail.com`) |
| `GMAIL_APP_PASSWORD`| A [Gmail App Password](https://myaccount.google.com/apppasswords) — **not** your main Gmail password. Requires 2-Step Verification to be enabled on the account. |

### Set credentials in production

Add the variables in your host's dashboard — **never commit them**:

- **Vercel**: Project Settings → Environment Variables
- **Netlify**: Site configuration → Environment variables

### Run locally

1. Copy the example env file and fill in real values:

   ```sh
   cp .env.example .env
   # then edit .env with your GMAIL_USER and GMAIL_APP_PASSWORD
   ```

2. Start the local dev server (picks up `.env` automatically and proxies `/api/*`):

   ```sh
   # Vercel
   npx vercel dev

   # Netlify
   npx netlify dev
   ```

   The site will be at `http://localhost:3000` (Vercel) or `http://localhost:8888` (Netlify) and the quote form will POST to `/api/quote` using the local function.

> **Note:** `npm start` runs a plain static server (`serve`) — it does **not** start the serverless function. Use `vercel dev` / `netlify dev` to test end-to-end locally.
