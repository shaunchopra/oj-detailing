import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

const assets = ['index.html', 'terms.html', 'css', 'js', 'images'];

const posthogToken = process.env.POSTHOG_PROJECT_TOKEN?.trim() ?? '';
const posthogHost = process.env.POSTHOG_API_HOST?.trim() || 'https://us.i.posthog.com';

function injectPostHog(html) {
  return html
    .replaceAll('__POSTHOG_PROJECT_TOKEN__', posthogToken)
    .replaceAll('__POSTHOG_API_HOST__', posthogHost);
}

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

for (const asset of assets) {
  const source = join(root, asset);
  const target = join(dist, asset);

  if (asset === 'index.html' || asset === 'terms.html') {
    writeFileSync(target, injectPostHog(readFileSync(source, 'utf8')));
    continue;
  }

  cpSync(source, target, { recursive: true });
}

if (posthogToken) {
  console.log('PostHog analytics enabled');
} else {
  console.log('PostHog analytics disabled (set POSTHOG_PROJECT_TOKEN to enable)');
}

console.log(`Static site built → ${dist}`);
