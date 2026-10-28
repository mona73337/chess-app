import { useState } from 'react';
import { DIFFICULTIES, type Difficulty } from '../engine/stockfish';

export type Mode = 'local' | 'ai';

interface Props {
  onStart: (mode: Mode, difficulty: Difficulty) => void;
}

export function ModeSelect({ onStart }: Props) {
  const [mode, setMode] = useState<Mode>('local');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  return (
    <main className="start">
      <h1 className="start-title">Chess</h1>
      <p className="start-lede">Choose who you're playing against.</p>

      <fieldset className="choice-group">
        <legend className="sr-only">Game mode</legend>
        <label className={`choice ${mode === 'local' ? 'is-selected' : ''}`}>
          <input type="radio" name="mode" value="local" checked={mode === 'local'} onChange={() => setMode('local')} />
          <span className="choice-name">2 Players (local)</span>
          <span className="choice-note">Take turns on this screen.</span>
        </label>
        <label className={`choice ${mode === 'ai' ? 'is-selected' : ''}`}>
          <input type="radio" name="mode" value="ai" checked={mode === 'ai'} onChange={() => setMode('ai')} />
          <span className="choice-name">vs Computer</span>
          <span className="choice-note">You play White against Stockfish.</span>
        </label>
      </fieldset>

      {mode === 'ai' && (
        <fieldset className="difficulty">
          <legend>Difficulty</legend>
          <div className="segmented">
            {(Object.keys(DIFFICULTIES) as Difficulty[]).map((d) => (
              <label key={d} className={difficulty === d ? 'is-selected' : ''}>
                <input type="radio" name="difficulty" value={d} checked={difficulty === d} onChange={() => setDifficulty(d)} />
                {DIFFICULTIES[d].label}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <button className="btn btn-primary start-button" onClick={() => onStart(mode, difficulty)}>
        Start game
      </button>
    </main>
  );
}
