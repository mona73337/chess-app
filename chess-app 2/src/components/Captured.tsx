import type { Color, PieceSymbol } from 'chess.js';

const GLYPH: Record<PieceSymbol, string> = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' };
const VALUE: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const ORDER: PieceSymbol[] = ['q', 'r', 'b', 'n', 'p'];

interface Props {
  captured: Record<Color, PieceSymbol[]>;
}

function Row({ by, pieces, lead }: { by: Color; pieces: PieceSymbol[]; lead: number }) {
  const sorted = [...pieces].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
  const victim = by === 'w' ? 'black' : 'white';
  return (
    <div className="captured-row">
      <span className="captured-label">{by === 'w' ? 'White' : 'Black'} took</span>
      <span className={`captured-pieces is-${victim}`} aria-label={`${pieces.length} pieces`}>
        {sorted.length ? sorted.map((p, i) => <span key={i}>{GLYPH[p]}</span>) : <span className="captured-none">nothing yet</span>}
      </span>
      {lead > 0 && <span className="captured-lead">+{lead}</span>}
    </div>
  );
}

export function Captured({ captured }: Props) {
  const score = (c: Color) => captured[c].reduce((n, p) => n + VALUE[p], 0);
  const diff = score('w') - score('b');
  return (
    <section className="captured">
      <Row by="w" pieces={captured.w} lead={diff} />
      <Row by="b" pieces={captured.b} lead={-diff} />
    </section>
  );
}
