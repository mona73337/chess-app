import { useEffect, useRef } from 'react';
import type { Move } from 'chess.js';
import type { Outcome } from '../hooks/useChessGame';
import { resultMark } from '../lib/status';

interface Props {
  history: Move[];
  outcome: Outcome | null;
}

/** Move list laid out like a tournament scoresheet. */
export function Scoresheet({ history, outcome }: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [history.length]);

  // Positions loaded from FEN can start with Black to move.
  const blackFirst = history[0]?.color === 'b';
  const startNo = history[0] ? Number(history[0].before.split(' ')[5]) || 1 : 1;
  const rows: { no: number; white?: string; black?: string }[] = [];
  let i = 0;
  if (blackFirst) rows.push({ no: startNo, white: '…', black: history[i++].san });
  for (; i < history.length; i += 2) {
    rows.push({ no: startNo + rows.length, white: history[i].san, black: history[i + 1]?.san });
  }

  return (
    <section className="scoresheet" aria-label="Moves">
      <div className="sheet-head" aria-hidden="true">
        <span />
        <span>White</span>
        <span>Black</span>
      </div>
      <ol className="sheet-body">
        {rows.length === 0 && !outcome && <li className="sheet-empty">Moves will appear here.</li>}
        {rows.map((r) => (
          <li key={r.no} className="sheet-row">
            <span className="sheet-no">{r.no}</span>
            <span className="sheet-move">{r.white}</span>
            <span className="sheet-move">{r.black ?? ''}</span>
          </li>
        ))}
      </ol>
      {outcome && <p className="sheet-result">{resultMark(outcome)}</p>}
      <div ref={endRef} />
    </section>
  );
}
