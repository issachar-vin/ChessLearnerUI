# ChessLearner UI

React 18 + Vite + TypeScript + Tailwind. The interactive board for drilling openings
against the backend AI.

## Layout

Full-bleed three-pane layout in [src/App.tsx](src/App.tsx) (no top banner — the panes run to
the top of the screen, columns flush to the edges):
- **Left** — the **logo + "Chess Bro" title**, then a **Free play / Load PGN** toolbar over two
  stacked `OpeningPanel`s (top = **AI opponent**, bottom = **You**), each with Recent /
  Favorites / Search tabs. The two keep **separate** recent/favorite/search state
  (`useOpeningLibrary("ai" | "user")`, namespaced localStorage; two `useOpenings` instances).
  The user panel hosts the White/Black side toggle; the AI panel lists the opposite colour's
  lines and a **Default ✕** to clear the bias.
- **Center** — `Controls` (mode / strict / reset), the turn status, a `PlayerArea` above (AI)
  and below (you) that **flex-fill the column height**, the `ChessBoard`, and `PreviewToggles`
  at the bottom. The **you** `PlayerArea` also hosts the **Autoplay toggle** (see Modes below).
- **Right** — the **`ProfileMenu`** (name + avatar dropdown) at the top, then `MoveList`
  (opening name, next-move hints, clickable history with per-move analysis badges and a
  game-end divider, the ◀ ▶ nav bar, and the Analyse button / accuracy panel) and `DrawTracker`.

The board is shown whenever the game is **active** — an opening is selected, **Free play** is
on, or a **PGN** was loaded (`PgnLoader` parses it with chess.js → `game.loadGame`).

Components live under `src/components/` (`Board`, `Controls`, `MoveList`, `OpeningPanel`,
`PlayerArea`, `Profile`, `Tooltip`, `DrawTracker`, `PieceIcon`). Board rendering uses
`react-chessboard`; local move legality uses `chess.js`. API types in `src/types/chess.ts`,
HTTP client in `src/services/api.ts` (base URL from `VITE_API_URL`; `src/vite-env.d.ts`
types `import.meta.env`).

## Modes & previews

Three opponent modes (`Mode` in `types/chess.ts`), switchable mid-game, plus a Guided
**strict** sub-toggle:
- **Guided** — opponent follows the selected line. Strict ON rejects off-line learner
  moves (toast); strict OFF allows any move. The Guided preview/hint tracks a **progress
  cursor** (`guidedNext` in `useChessGame.ts`): opponent-colour line moves are passed as
  soon as the opponent moves, learner-colour moves only when the learner plays them exactly.
  So deviating never skips your step — it parks on the move you missed — and the cursor never
  gets stuck on an opponent move once you're off-line. (Recommended still follows the line by
  board ply, falling back to the engine hint.)
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
  strict reference move). `ai-move` is sent with the current `mode` and the optional
  `ai_opening_id` — the AI follows that opening (FEN-matched on the backend) until off-line,
  then reverts to `mode`.
- **Free play / PGN** (`freePlay` prop, `loadGame`): the hook is "active" when an opening is
  set **or** `freePlay` is on. Free play starts an empty board (AI still replies, previews and
  analysis work with a null opening). `loadGame(uciMoves)` sets the history and parks the board
  at the start for ◀ ▶ replay; a `pendingLoadRef` stops the reset effect wiping a just-loaded
  game. **Game review**: `App` calls `/api/game/review` and passes per-move classifications to
  `MoveList` for badges; the result is cleared whenever the move list length changes.
- **Autoplay** (`autoPlay`/`setAutoPlay`, toggled from the **you** `PlayerArea` button): at the
  live tip on the learner's turn it plays the learner's move automatically (`guidedNext` step,
  else `analysis.recommended`) so the opening runs itself out. The toggle is hidden while a PGN
  is loaded (`loadedFromPgn`) — a loaded game is for review — and is switched **off** whenever
  the game ends or is reset. The same move backs `nextIsAutoPlay`: the MoveList **▶❘** forward
  button plays it at the tip (green when it's a move for you, white when it just steps recorded
  history). `loadedFromPgn` is set by `loadGame` and cleared once the learner makes their own
  move or the game resets. The MoveList nav bar's centre **▶/❚❚** is one play/pause control
  (`onTogglePlay`): it shows **❚❚** while either a history replay or autoplay is running, and a
  click pauses whichever is active (else it starts replaying recorded moves).
- **Game-end marker** (`endgame`): the hook scans recorded history for the first ply that is
  terminal and returns `{ ply, result }`; `MoveList` renders a divider row there so any moves
  played after checkmate/stalemate/draw are visibly post-game (moves after game-over are allowed).

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
