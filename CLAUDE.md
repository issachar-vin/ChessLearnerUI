# ChessLearner UI

React 18 + Vite + TypeScript + Tailwind. The interactive board for drilling openings
against the backend AI.

## Layout

Three-pane layout in [src/App.tsx](src/App.tsx):
- **Left** — `OpeningSelector` (search box + flat catalog list) and a White/Black side
  toggle. The catalog is large (thousands of named lines), so it is searched, not listed.
- **Center** — `Controls` + `ChessBoard`.
- **Right** — `MoveList` (clickable history, live opening name, per-mode next-move hints).

Components live under `src/components/` (`Board`, `Controls`, `MoveList`,
`OpeningSelector`). Board rendering uses `react-chessboard`; local move legality uses
`chess.js`. API types in `src/types/chess.ts`, HTTP client in `src/services/api.ts`
(base URL from `VITE_API_URL`; `src/vite-env.d.ts` types `import.meta.env`).

## Modes & previews

Three opponent modes (`Mode` in `types/chess.ts`), switchable mid-game, plus a Guided
**strict** sub-toggle:
- **Guided** — opponent follows the selected line. Strict ON rejects off-line learner
  moves (toast); strict OFF allows any move.
- **Sparring** — opponent plays the most common book move.
- **Challenge** — opponent plays the engine's best move.

`Controls` also hosts undo/redo (◀ ▶), reset, and a **Previews** dropdown toggling
color-coded `customArrows` (react-chessboard) for each source's next move. Colors live in
`ARROW_COLORS` in `useChessGame.ts` (recommended=emerald, guided=blue, sparring=amber,
challenge=purple).

## State flow — `src/hooks/useChessGame.ts`

History-pointer model. **Refs are the source of truth** (`chessRef`, `historyRef`,
`pointerRef`); `snapshot` state is the render projection. Latest props (mode/strict/
userSide/openingId/analysis) are mirrored into a `cfg` ref so move handlers never read
stale values.

- **AI replies only when the learner moves their own colour** (`movedSide === userChar`).
  Undo, redo, and manually moving the opponent's pieces never trigger a reply. The
  opponent opens the game only when the learner plays the second-moving side (in `reset`).
- **Navigation:** `undo`/`redo`/`jumpTo` rebuild the board by replaying `history[0..pointer]`.
  Making a new move from a past pointer truncates the forward history (`canRedo` then false).
- `analyze` is fetched whenever it lands on the learner's turn (hint + previews + the
  strict reference move). `ai-move` is sent with the current `mode`.

**Highlights are derived, never stored** — `squareHighlights` (selection/legal/last-move)
and `previewArrows` are `useMemo`. Don't reintroduce a stored-highlights setter.

## Run / lint

From the repo root (`ChessLearner/`): `make start` (docker compose) or `make ui-lint`.
Standalone: `npm run dev`. Before any PR run `npm run build` (`tsc -b && vite build`) —
ESLint does not catch type errors. `npm run typecheck` for types only.

## Maintenance

Keep this file current. When you change the component layout, the modes/previews, the
`useChessGame` history-pointer model, or the run/lint commands, update the relevant
section here in the same change.
