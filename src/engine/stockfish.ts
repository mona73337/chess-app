// Thin UCI wrapper around Stockfish running in a Web Worker.
// The engine only suggests moves; chess.js validates and applies them.

export type Difficulty = 'easy' | 'medium' | 'hard';

export const DIFFICULTIES: Record<Difficulty, { label: string; skill: number; depth: number }> = {
  easy: { label: 'Easy', skill: 1, depth: 5 },
  medium: { label: 'Medium', skill: 10, depth: 10 },
  hard: { label: 'Hard', skill: 20, depth: 12 },
};

// Hard upper bound on thinking time so replies stay under ~2s on slow devices.
const MOVETIME_CAP_MS = 1500;

const ENGINE_URL = `${import.meta.env.BASE_URL}stockfish/stockfish-19-lite-single.js`;

type Waiter = { resolve: (move: string) => void; reject: (err: Error) => void; cancelled: boolean };

export interface Search {
  promise: Promise<string>;
  cancel: () => void;
}

export class StockfishEngine {
  private worker: Worker;
  private ready: Promise<void>;
  // UCI answers searches in order, so each `go` waits for the next `bestmove`.
  private waiters: Waiter[] = [];
  private failed: Error | null = null;

  constructor() {
    this.worker = new Worker(ENGINE_URL);
    let onReady: () => void = () => {};
    let onFail: (e: Error) => void = () => {};
    this.ready = new Promise<void>((res, rej) => {
      onReady = res;
      onFail = rej;
    });

    this.worker.onmessage = (ev: MessageEvent) => {
      const line = typeof ev.data === 'string' ? ev.data : '';
      if (line === 'uciok') this.send('isready');
      else if (line === 'readyok') onReady();
      else if (line.startsWith('bestmove')) {
        const waiter = this.waiters.shift();
        const move = line.split(/\s+/)[1] ?? '';
        if (waiter && !waiter.cancelled) waiter.resolve(move);
      }
    };
    this.worker.onerror = (ev: ErrorEvent) => {
      ev.preventDefault();
      this.failed = new Error(ev.message || 'Stockfish worker failed to load');
      onFail(this.failed);
      for (const w of this.waiters) if (!w.cancelled) w.reject(this.failed);
      this.waiters = [];
    };
    this.send('uci');
  }

  private send(cmd: string) {
    this.worker.postMessage(cmd);
  }

  whenReady(): Promise<void> {
    return this.ready;
  }

  newGame() {
    this.stop();
    this.send('ucinewgame');
  }

  stop() {
    for (const w of this.waiters) w.cancelled = true;
    if (this.waiters.length) this.send('stop');
  }

  /** Ask for the best move in UCI form, e.g. "e7e5" or "e7e8q". */
  bestMove(fen: string, difficulty: Difficulty): Search {
    const { skill, depth } = DIFFICULTIES[difficulty];
    let waiter!: Waiter;
    const promise = new Promise<string>((resolve, reject) => {
      waiter = { resolve, reject, cancelled: false };
    });

    this.ready.then(
      () => {
        if (waiter.cancelled) return;
        this.waiters.push(waiter);
        this.send(`setoption name Skill Level value ${skill}`);
        this.send(`position fen ${fen}`);
        this.send(`go depth ${depth} movetime ${MOVETIME_CAP_MS}`);
      },
      (err: Error) => waiter.reject(err),
    );
    if (this.failed) waiter.reject(this.failed);

    return {
      promise,
      cancel: () => {
        if (waiter.cancelled) return;
        waiter.cancelled = true;
        if (this.waiters.includes(waiter)) this.send('stop');
      },
    };
  }

  terminate() {
    this.stop();
    this.worker.terminate();
  }
}

/** Split a UCI move like "e7e8q" into chess.js move input. */
export function parseUci(uci: string): { from: string; to: string; promotion?: string } | null {
  const m = /^([a-h][1-8])([a-h][1-8])([qrbn])?$/.exec(uci);
  if (!m) return null;
  return { from: m[1], to: m[2], promotion: m[3] };
}
