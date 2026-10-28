import { useCallback, useEffect, useState } from 'react';
import type { Color } from 'chess.js';
import { ModeSelect, type Mode } from './components/ModeSelect';
import { GameBoard } from './components/GameBoard';
import { Scoresheet } from './components/Scoresheet';
import { Captured } from './components/Captured';
import { useChessGame } from './hooks/useChessGame';
import { DIFFICULTIES, StockfishEngine, parseUci, type Difficulty } from './engine/stockfish';
import { colorName, outcomeText } from './lib/status';

interface Setup {
  mode: Mode;
  difficulty: Difficulty;
  fen?: string;
}

// Dev-only shortcut for testing positions: /?mode=local&fen=<FEN>
// Vite drops this branch from production builds.
function readDevSetup(): Setup | null {
  if (!import.meta.env.DEV) return null;
  const p = new URLSearchParams(window.location.search);
  const mode = p.get('mode');
  if (mode !== 'local' && mode !== 'ai') return null;
  const level = p.get('level');
  const difficulty: Difficulty = level === 'easy' || level === 'hard' ? level : 'medium';
  return { mode, difficulty, fen: p.get('fen') ?? undefined };
}

export function App() {
  const [setup, setSetup] = useState<Setup | null>(readDevSetup);

  if (!setup) return <ModeSelect onStart={(mode, difficulty) => setSetup({ mode, difficulty })} />;
  return <Game key={`${setup.mode}-${setup.difficulty}`} setup={setup} onChangeMode={() => setSetup(null)} />;
}

function Game({ setup, onChangeMode }: { setup: Setup; onChangeMode: () => void }) {
  const { mode, difficulty } = setup;
  const { view, move, undo, reset, legalTargets, pieceColorAt } = useChessGame(setup.fen);
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');
  const [engine, setEngine] = useState<StockfishEngine | null>(null);
  const [engineError, setEngineError] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);

  // Start the engine worker only for games against the computer.
  useEffect(() => {
    if (mode !== 'ai') return;
    const e = new StockfishEngine();
    setEngine(e);
    e.whenReady().catch(() => setEngineError("The computer opponent couldn't load. Reload the page to try again."));
    return () => {
      e.terminate();
      setEngine(null);
    };
  }, [mode]);

  // Human is White, so the engine replies whenever it's Black's turn.
  const aiToMove = mode === 'ai' && view.turn === 'b' && !view.outcome && !engineError;
  useEffect(() => {
    if (!aiToMove || !engine) return;
    let live = true;
    setThinking(true);
    const search = engine.bestMove(view.fen, difficulty);
    search.promise.then(
      (uci) => {
        if (!live) return;
        const parsed = parseUci(uci);
        // chess.js still has the final say on legality.
        if (!parsed || !move(parsed.from, parsed.to, parsed.promotion)) {
          setEngineError(`The computer returned a move that isn't legal here (${uci || 'none'}). Start a new game to continue.`);
        }
        setThinking(false);
      },
      () => {
        if (!live) return;
        setEngineError("The computer opponent couldn't load. Reload the page to try again.");
        setThinking(false);
      },
    );
    return () => {
      live = false;
      search.cancel();
      setThinking(false);
    };
  }, [aiToMove, engine, view.fen, difficulty, move]);

  const onMove = useCallback((from: string, to: string) => move(from, to) !== null, [move]);

  const newGame = () => {
    engine?.newGame();
    setEngineError(null);
    reset();
  };

  const movableColors: Color[] =
    view.outcome || thinking || engineError ? [] : mode === 'local' ? [view.turn] : view.turn === 'w' ? ['w'] : [];

  let status: string;
  let tone: 'normal' | 'check' | 'over' | 'thinking' | 'error' = 'normal';
  if (engineError) {
    status = engineError;
    tone = 'error';
  } else if (view.outcome) {
    status = outcomeText(view.outcome);
    tone = 'over';
  } else if (thinking || aiToMove) {
    status = 'AI thinking…';
    tone = 'thinking';
  } else {
    status = `${colorName(view.turn)} to move${view.inCheck ? ', in check' : ''}`;
    if (view.inCheck) tone = 'check';
  }

  const modeLabel = mode === 'local' ? '2 players' : `vs Computer, ${DIFFICULTIES[difficulty].label.toLowerCase()}`;

  return (
    <div className="app">
      <header className="topbar">
        <h1 className="wordmark">Chess</h1>
        <span className="mode-tag">{modeLabel}</span>
        <button className="btn-link" onClick={onChangeMode}>
          Change mode
        </button>
      </header>

      <main className="table">
        <GameBoard
          view={view}
          orientation={orientation}
          movableColors={movableColors}
          onMove={onMove}
          legalTargets={legalTargets}
          pieceColorAt={pieceColorAt}
        />

        <aside className="panel">
          <p className="status" data-tone={tone} role="status" aria-live="polite" data-testid="status">
            {tone === 'thinking' && <span className="pulse" aria-hidden="true" />}
            {status}
          </p>
          <Captured captured={view.captured} />
          <Scoresheet history={view.history} outcome={view.outcome} />
          <div className="controls">
            <button className="btn btn-primary" onClick={newGame}>
              New game
            </button>
            <button className="btn" onClick={() => setOrientation((o) => (o === 'white' ? 'black' : 'white'))}>
              Flip board
            </button>
            <button
              className="btn"
              onClick={undo}
              disabled={mode === 'ai' || view.history.length === 0}
              title={mode === 'ai' ? 'Undo is off in games against the computer' : undefined}
            >
              Undo
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}
