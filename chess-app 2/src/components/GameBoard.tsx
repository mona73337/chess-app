import { useMemo, useState, type CSSProperties } from 'react';
import { Chessboard, type PieceDropHandlerArgs, type SquareHandlerArgs, type PieceHandlerArgs } from 'react-chessboard';
import type { Color, Square } from 'chess.js';
import type { GameView } from '../hooks/useChessGame';

interface Props {
  view: GameView;
  orientation: 'white' | 'black';
  /** Which colors the person at this screen may move right now. Empty = board locked. */
  movableColors: Color[];
  onMove: (from: string, to: string) => boolean;
  legalTargets: (square: string) => Square[];
  pieceColorAt: (square: string) => Color | null;
}

const LAST_MOVE: CSSProperties = { backgroundColor: 'var(--last-move)' };
const CHECK: CSSProperties = {
  backgroundImage: 'radial-gradient(circle, var(--check) 0%, var(--check) 38%, transparent 75%)',
};
const SELECTED: CSSProperties = { boxShadow: 'inset 0 0 0 4px var(--brass)' };
const TARGET: CSSProperties = {
  backgroundImage: 'radial-gradient(circle, var(--target) 0%, var(--target) 18%, transparent 20%)',
};
const CAPTURE_TARGET: CSSProperties = {
  backgroundImage: 'radial-gradient(circle, transparent 0%, transparent 70%, var(--target) 72%)',
};

export function GameBoard({ view, orientation, movableColors, onMove, legalTargets, pieceColorAt }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const locked = movableColors.length === 0;
  const canMove = (color: Color | null) => !!color && movableColors.includes(color) && color === view.turn;

  // Clear a stale selection whenever the position changes.
  const [seenFen, setSeenFen] = useState(view.fen);
  if (seenFen !== view.fen) {
    setSeenFen(view.fen);
    setSelected(null);
  }

  const targets = useMemo(() => (selected ? legalTargets(selected) : []), [selected, legalTargets, view.fen]);

  const squareStyles = useMemo(() => {
    const s: Record<string, CSSProperties> = {};
    if (view.lastMove) {
      s[view.lastMove.from] = LAST_MOVE;
      s[view.lastMove.to] = LAST_MOVE;
    }
    if (view.checkedKing) s[view.checkedKing] = { ...s[view.checkedKing], ...CHECK };
    if (selected) s[selected] = { ...s[selected], ...SELECTED };
    for (const t of targets) s[t] = { ...s[t], ...(pieceColorAt(t) ? CAPTURE_TARGET : TARGET) };
    return s;
  }, [view.lastMove, view.checkedKing, selected, targets, pieceColorAt]);

  const handleDrop = ({ sourceSquare, targetSquare }: PieceDropHandlerArgs) => {
    setSelected(null);
    if (!targetSquare || locked) return false;
    return onMove(sourceSquare, targetSquare);
  };

  const handleSquareClick = ({ square }: SquareHandlerArgs) => {
    if (locked) return;
    if (selected && targets.includes(square as Square)) {
      onMove(selected, square);
      setSelected(null);
      return;
    }
    if (canMove(pieceColorAt(square)) && square !== selected) setSelected(square);
    else setSelected(null);
  };

  const canDragPiece = ({ piece }: PieceHandlerArgs) => !locked && canMove(piece.pieceType[0] as Color);

  return (
    <div className="board-frame" data-locked={locked || undefined}>
      <Chessboard
        options={{
          id: 'main-board',
          position: view.fen,
          boardOrientation: orientation,
          onPieceDrop: handleDrop,
          onSquareClick: handleSquareClick,
          canDragPiece,
          allowDragging: !locked,
          allowDrawingArrows: false,
          squareStyles,
          darkSquareStyle: { backgroundColor: 'var(--walnut)' },
          lightSquareStyle: { backgroundColor: 'var(--maple)' },
          darkSquareNotationStyle: { color: 'var(--maple)', fontWeight: 600 },
          lightSquareNotationStyle: { color: 'var(--walnut)', fontWeight: 600 },
          animationDurationInMs: 180,
        }}
      />
    </div>
  );
}
