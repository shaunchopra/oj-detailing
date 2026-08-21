import * as esbuild from 'esbuild';
import { rmSync } from 'node:fs';

rmSync('dist', { recursive: true, force: true });

await esbuild.build({
  entryPoints: ['src/lambda.ts'],
  bundle: true,
  platform: 'node',
  target: 'node24',
  outfile: 'dist/lambda.js',
  format: 'cjs',
  sourcemap: true,
  minify: true,
  legalComments: 'none',
});
