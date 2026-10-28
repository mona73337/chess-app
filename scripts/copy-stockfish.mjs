// Copies the single-threaded "lite" Stockfish build into public/ so the
// browser can load it as a Web Worker. It needs no special server headers,
// so it runs on GitHub Pages and works offline once loaded.
import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'node_modules', 'stockfish', 'bin');
const dest = join(root, 'public', 'stockfish');
const files = ['stockfish-19-lite-single.js', 'stockfish-19-lite-single.wasm'];

if (!existsSync(src)) {
  console.error('copy-stockfish: node_modules/stockfish/bin not found. Run npm install first.');
  process.exit(1);
}
mkdirSync(dest, { recursive: true });
for (const f of files) copyFileSync(join(src, f), join(dest, f));
console.log(`copy-stockfish: copied ${files.length} files to public/stockfish`);
