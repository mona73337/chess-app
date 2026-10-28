import type { Color } from 'chess.js';
import type { Outcome } from '../hooks/useChessGame';

export const colorName = (c: Color) => (c === 'w' ? 'White' : 'Black');

export function outcomeText(o: Outcome): string {
  switch (o.kind) {
    case 'checkmate':
      return `${colorName(o.winner)} wins by checkmate`;
    case 'stalemate':
      return 'Draw by stalemate';
    case 'insufficient':
      return 'Draw by insufficient material';
    case 'threefold':
      return 'Draw by threefold repetition';
    case 'fifty':
      return 'Draw by the 50-move rule';
  }
}

/** Scoresheet result notation. */
export function resultMark(o: Outcome): string {
  if (o.kind === 'checkmate') return o.winner === 'w' ? '1–0' : '0–1';
  return '½–½';
}
