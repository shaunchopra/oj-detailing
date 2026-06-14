import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

const assets = ['index.html', 'terms.html', 'css', 'js', 'images'];

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

for (const asset of assets) {
  cpSync(join(root, asset), join(dist, asset), { recursive: true });
}

console.log(`Static site built → ${dist}`);
