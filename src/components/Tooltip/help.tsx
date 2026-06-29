import type { ReactNode } from "react";
import { ARROW_COLORS } from "../../hooks/useChessGame";

interface Help {
  title: string;
  body: ReactNode;
}

const dot = (color: string) => (
  <span
    className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle shrink-0"
    style={{ backgroundColor: color }}
  />
);

export const HELP: Record<string, Help> = {
  mode: {
    title: "Opponent modes",
    body: (
      <ul className="space-y-1.5">
        <li>
          <span className="text-slate-200 font-medium">Guided</span> — replays your selected line
          from the bundled lichess <em>chess-openings</em> catalog. Leave the line and it falls back
          to the Stockfish engine.
        </li>
        <li>
          <span className="text-slate-200 font-medium">Sparring</span> — plays the most common move
          from a local Polyglot opening book (<code>book.bin</code>). Out of book → Stockfish.
        </li>
        <li>
          <span className="text-slate-200 font-medium">Challenge</span> — plays Stockfish's best
          move; strength is tuned only by engine think-time.
        </li>
      </ul>
    ),
  },
  strict: {
    title: "Strict (Guided only)",
    body: (
      <p>
        When on, moves that leave the opening line are rejected so you stay on book. Turn it off to
        explore freely — the Guided hint keeps pointing at the next line move.
      </p>
    ),
  },
  nav: {
    title: "Undo / Redo",
    body: (
      <p>
        Step backward (◀) and forward (▶) through the move history. Navigating never triggers an
        opponent reply — only playing your own colour does.
      </p>
    ),
  },
  reset: {
    title: "Reset",
    body: (
      <p>
        Restart the current opening from the first move. If you play the second-moving side, the
        opponent opens the game automatically.
      </p>
    ),
  },
  previews: {
    title: "Move previews",
    body: (
      <>
        <p>Color-coded arrows for what each source would play next:</p>
        <ul className="space-y-1 mt-1">
          <li>
            {dot(ARROW_COLORS.recommended)}
            <span className="text-slate-200">Recommended</span> — the move to play.
          </li>
          <li>
            {dot(ARROW_COLORS.guided)}
            <span className="text-slate-200">Guided</span> — your next opening-line step.
          </li>
          <li>
            {dot(ARROW_COLORS.sparring)}
            <span className="text-slate-200">Sparring</span> — top Polyglot book move.
          </li>
          <li>
            {dot(ARROW_COLORS.challenge)}
            <span className="text-slate-200">Challenge</span> — Stockfish's best move.
          </li>
        </ul>
        <p className="mt-1">Arrows show on your turn only, and only when the move is legal.</p>
      </>
    ),
  },
  side: {
    title: "Your side",
    body: (
      <p>
        Choose whether you play White or Black. The board flips to your side and the opening list
        filters to lines for that colour.
      </p>
    ),
  },
  eco: {
    title: "ECO code",
    body: (
      <p>
        The <span className="text-slate-200">Encyclopaedia of Chess Openings</span> classifies every
        opening with a letter (A–E) and number (00–99) — e.g. <code>A00</code> covers irregular first
        moves. Codes come from the bundled lichess <em>chess-openings</em> dataset.
      </p>
    ),
  },
};
