# Chess

Play chess against a friend on the same screen, or play White against the Stockfish engine. Runs entirely on your device, with no accounts or server, and works offline.

**Play in your browser:** https://mona73337.github.io/chess-app/

**Android app:** download `chess.apk` from the [latest release](https://github.com/mona73337/chess-app/releases/tag/android-latest), open it on your phone and tap Install. Android will ask you to allow installs from your browser or file manager the first time.

## Features

- **2 Players (local):** take turns on one screen, with Undo.
- **vs Computer:** you play White against Stockfish at Easy, Medium or Hard.
- Full chess rules: castling, en passant, promotion (auto-queen), checkmate, stalemate, insufficient material, threefold repetition and the 50-move rule.
- Drag-and-drop or tap-to-move, with legal-move hints.
- Last move and checked king highlighted.
- Move list, captured pieces with a material count, and Flip Board.

## What's in this repository

| Path | What it is |
| --- | --- |
| `src/` | The app's source code (React + TypeScript) |
| `src/components/` | Screen pieces: mode picker, board, move list, captured pieces |
| `src/engine/stockfish.ts` | Talks to the Stockfish chess engine |
| `src/hooks/useChessGame.ts` | Game state, using chess.js for all rules |
| `index.html` | The page the app loads into |
| `package.json`, `package-lock.json` | The list of libraries the app uses, at exact versions |
| `vite.config.ts`, `tsconfig.json` | Build and type-checking settings |
| `capacitor.config.ts` | Settings for the Android app (name, app ID) |
| `scripts/copy-stockfish.mjs` | Copies the engine files into the build |
| `.github/workflows/deploy.yml` | Builds and publishes the website to GitHub Pages |
| `.github/workflows/android.yml` | Builds the APK and publishes it to Releases |

Built files (the website and the APK) are not stored in the code. GitHub builds them from this source on every push to `main`, so they are always in sync with the code. GitHub lists folders first, then files alphabetically; that order is automatic.

## Run locally

Requires Node.js 20 or newer.

```bash
npm install     # also copies the Stockfish engine into public/stockfish
npm run dev     # http://localhost:5173
npm run build   # type-checks, then builds to dist/
npm run preview # serves the production build
```

To build the APK on your own computer you also need Android Studio (or JDK 21 plus the Android SDK):

```bash
npx cap add android   # first time only
npm run android:sync  # rebuild the web app and copy it into the Android project
cd android && ./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

## Publishing

Both workflows run automatically on every push to `main`:

- **Website:** needs GitHub Pages turned on once. In **Settings → Pages**, set **Source** to **GitHub Actions**.
- **APK:** no setup needed. Each run replaces the `android-latest` release with a fresh `chess.apk`.

The APK is a debug-signed build, which installs fine by sideloading but can't go on the Play Store. Each build is signed with a new key, so to update an installed copy, uninstall the old one first.

## How it works

| Library | Role |
| --- | --- |
| `chess.js` | Single source of truth for rules, legality and game-over detection |
| `react-chessboard` | Board rendering and drag-and-drop |
| `stockfish` | Stockfish 19 (lite, single-threaded WASM) running in a Web Worker |
| `@capacitor/android` | Wraps the web app as an Android app |

The engine is sent `position fen <fen>` and `go depth <d> movetime 1500`, and its `bestmove` is applied through chess.js, which rejects anything illegal.

| Difficulty | Skill Level | Depth |
| --- | --- | --- |
| Easy | 1 | 5 |
| Medium | 10 | 10 |
| Hard | 20 | 12 |

Every search is capped at 1.5 seconds.

For development, `/?mode=local&fen=<FEN>` (or `mode=ai&level=hard`) starts from any position. This shortcut is removed from production builds.

## License note

Stockfish is licensed under the GPLv3, which applies to the engine files the website and APK include. See `node_modules/stockfish/Copying.txt`.
