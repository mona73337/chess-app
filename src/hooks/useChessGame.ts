import { useCallback, useMemo, useRef, useState } from 'react';
import { Chess, type Color, type Move, type PieceSymbol, type Square } from 'chess.js';

export type Outcome =
  | { kind: 'checkmate'; winner: Color }
  | { kind: 'stalemate' }
  | { kind: 'insufficient' }
  | { kind: 'threefold' }
  | { kind: 'fifty' };

export interface GameView {
  fen: string;
  turn: Color;
  history: Move[];
  inCheck: boolean;
  checkedKing: Square | null;
  lastMove: { from: Square; to: Square } | null;
  outcome: Outcome | null;
  /** Pieces each side has captured from the other. */
  captured: Record<Color, PieceSymbol[]>;
}

// All rules come from chess.js. This hook only reads its answers.
function readOutcome(game: Chess): Outcome | null {
  if (game.isCheckmate()) return { kind: 'checkmate', winner: game.turn() === 'w' ? 'b' : 'w' };
  if (game.isStalemate()) return { kind: 'stalemate' };
  if (game.isInsufficientMaterial()) return { kind: 'insufficient' };
  if (game.isThreefoldRepetition()) return { kind: 'threefold' };
  if (game.isDrawByFiftyMoves()) return { kind: 'fifty' };
  return null;
}

export function useChessGame(initialFen?: string) {
  const gameRef = useRef<Chess>(null as unknown as Chess);
  if (gameRef.current === null) gameRef.current = new Chess(initialFen);
  const [version, setVersion] = useState(0);
  const bump = () => setVersion((v) => v + 1);

  const view: GameView = useMemo(() => {
    const game = gameRef.current;
    const history = game.history({ verbose: true });
    const last = history[history.length - 1];
    const inCheck = game.inCheck();
    const captured: Record<Color, PieceSymbol[]> = { w: [], b: [] };
    for (const m of history) if (m.captured) captured[m.color].push(m.captured);
    return {
      fen: game.fen(),
      turn: game.turn(),
      history,
      inCheck,
      checkedKing: inCheck ? (game.findPiece({ type: 'k', color: game.turn() })[0] ?? null) : null,
      lastMove: last ? { from: last.from, to: last.to } : null,
      outcome: readOutcome(game),
      captured,
    };
  }, [version]);

  /** Returns the move if chess.js accepts it, otherwise null. Auto-queens on promotion. */
  const move = useCallback((from: string, to: string, promotion: string = 'q'): Move | null => {
    const game = gameRef.current;
    if (game.isGameOver()) return null;
    try {
      const result = game.move({ from, to, promotion });
      bump();
      return result;
    } catch {
      return null;
    }
  }, []);

  const legalTargets = useCallback((square: string): Square[] => {
    return gameRef.current.moves({ square: square as Square, verbose: true }).map((m) => m.to);
  }, []);

  const pieceColorAt = useCallback((square: string): Color | null => {
    return gameRef.current.get(square as Square)?.color ?? null;
  }, []);

  const undo = useCallback(() => {
    if (gameRef.current.undo()) bump();
  }, []);

  const reset = useCallback((fen?: string) => {
    gameRef.current = new Chess(fen);
    bump();
  }, []);

  return { view, move, undo, reset, legalTargets, pieceColorAt };
}
