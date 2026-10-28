# Chess

A browser chess game. Play a friend on the same screen, or play White against the Stockfish engine. Everything runs client-side, with no backend or accounts, and the engine works offline once the page has loaded.

## Features

- **2 Players (local):** hot-seat play with Undo.
- **vs Computer:** you play White against Stockfish at Easy, Medium or Hard.
- Full rules from [chess.js](https://github.com/jhlywa/chess.js): castling, en passant, promotion (auto-queen), checkmate, stalemate, insufficient material, threefold repetition and the 50-move rule.
- Drag-and-drop or click-to-move, with legal-move hints.
- Last move and checked king highlighted.
- Move list in SAN, captured pieces with a material count, and Flip Board.

## Run locally

Requires Node.js 20 or newer.

```bash
npm install     # also copies the Stockfish engine into public/stockfish
npm run dev     # http://localhost:5173
npm run build   # type-checks, then builds to dist/
npm run preview # serves the production build
```

## Deploy to GitHub Pages

1. Create a new repository on GitHub and push this project to its `main` branch:
   ```bash
   git init
   git add .
   git commit -m "Chess app"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```
2. On GitHub, open the repository's **Settings → Pages**. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. The workflow in `.github/workflows/deploy.yml` builds and deploys on every push to `main`. Watch it under the **Actions** tab. The site will be at `https://<your-username>.github.io/<repo-name>/`.

The build uses relative paths (`base: './'` in `vite.config.ts`), so it works under any repository name with no extra configuration.

## How it works

| Piece | Role |
| --- | --- |
| `chess.js` | Single source of truth for rules, legality and game-over detection |
| `react-chessboard` | Board rendering and drag-and-drop |
| `stockfish` | Stockfish 19 (lite, single-threaded WASM) running in a Web Worker |

The engine is sent `position fen <fen>` and `go depth <d> movetime 1500`. Its `bestmove` is then applied through chess.js, which rejects anything illegal. The single-threaded lite build needs no cross-origin-isolation headers, so it runs on any static host.

| Difficulty | Skill Level | Depth |
| --- | --- | --- |
| Easy | 1 | 5 |
| Medium | 10 | 10 |
| Hard | 20 | 12 |

Every search is capped at 1.5 seconds.

### Project layout

```
src/
  App.tsx                    game screen, AI turn loop, status and controls
  engine/stockfish.ts        UCI wrapper around the worker
  hooks/useChessGame.ts      wraps one chess.js instance
  lib/status.ts              outcome text and result marks
  components/                ModeSelect, GameBoard, Scoresheet, Captured
scripts/copy-stockfish.mjs   copies the engine from node_modules on install
```

### Testing a position (development only)

`npm run dev`, then open `/?mode=local&fen=<FEN>` (or `mode=ai&level=hard`) to start from any position. This shortcut is removed from production builds.

## License note

Stockfish is licensed under the GPLv3. If you publish this app, the GPL applies to the engine files you serve; see `node_modules/stockfish/Copying.txt`.
