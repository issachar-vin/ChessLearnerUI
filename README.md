# Chess Bro

An open-source tool to learn and drill chess openings. Play through lines against a backend AI, review your games with Stockfish analysis, and build opening repertoires at your own pace.

## Why it exists

Memorizing chess openings is hard when you have no opponent to practice against. Chess Bro gives you an interactive board that knows the opening you're studying: the AI can follow the exact line, play the most popular book reply, or unleash Stockfish — all switchable mid-game. Once you've drilled a line, load any game as a PGN and replay it move-by-move with per-move engine evaluations and accuracy scores.

## How it works

### Architecture

Chess Bro is a **React frontend** that talks to a separate backend API. The UI handles all interaction and state; the backend provides opening data, AI move decisions, and Stockfish analysis.

```
Browser (React SPA)  ←──HTTP──→  Backend API (not in this repo)
                                      ├── Opening catalog (lichess dataset)
                                      ├── Polyglot book (sparring mode)
                                      └── Stockfish engine
```

### Opponent modes

| Mode | Behavior |
|---|---|
| **Guided** | AI follows the selected opening line exactly. Enable **Strict** to reject off-book learner moves with a warning. |
| **Sparring** | AI plays the most popular book move (Polyglot), falling back to Stockfish when out of book. |
| **Challenge** | AI always plays Stockfish's best move. |

You can switch modes mid-game. Both you and the AI can have independent openings selected — the AI follows its own opening until it diverges, then switches to the active mode.

### Key features

- **Opening library** — Search, browse, and star favorites. Separate recent/favorite lists for you and the AI, persisted in localStorage.
- **Move previews** — Color-coded arrows show what each source (recommended / guided / sparring / challenge) would play next. Toggle each one independently.
- **Autoplay** — Let the opening play itself out unattended (your moves are played automatically using the guided line or the recommended move).
- **PGN import** — Paste or upload any PGN to replay a game move-by-move. Autoplay is disabled in review mode.
- **Stockfish analysis** — "Analyse with Stockfish" runs a full engine review and annotates every move with a classification (brilliant / great / best / excellent / good / inaccuracy / mistake / blunder), centipawn loss, best alternative, and accuracy percentages for both sides.
- **Draw tracker** — Live progress bars for the 50-move rule, threefold repetition count, and insufficient material.
- **Captured pieces & material score** — Shown in each player area.
- **User profile** — Set your name and avatar (any chess piece, or upload a photo).

### State model

All game state lives in `src/hooks/useChessGame.ts` using a **history-pointer model**: `chessRef`, `historyRef`, and `pointerRef` are refs (source of truth); `snapshot` is the render projection derived from them. Undo/redo/jump-to replay history from the pointer. Highlights and preview arrows are pure `useMemo` — never stored in state.

### Backend API

The UI talks to `VITE_API_URL` (default `http://localhost:8000`). It expects these endpoints:

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/openings` | List openings (`?search=&limit=100`) |
| `GET` | `/api/openings/:id` | Single opening with full move list |
| `POST` | `/api/game/analyze` | Analyze a position; returns recommended move, previews, legal moves |
| `POST` | `/api/game/ai-move` | Request the AI's next move for the given mode and opening |
| `POST` | `/api/game/review` | Full Stockfish game review (per-move classifications + accuracy) |

## Tech stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript 5 |
| Build tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| Board | `react-chessboard` |
| Move validation | `chess.js` |
| Notifications | `react-hot-toast` |

## Running locally

### Prerequisites

- Node.js 18+
- A running backend API at `http://localhost:8000` (or set `VITE_API_URL`)

### Install dependencies

```bash
npm install
# or
make install
```

### Start the dev server

```bash
npm run dev
# or
make dev
```

The app is served with hot-reload at `http://localhost:5173`.

### Configure the backend URL

Create a `.env.local` file in the project root:

```env
VITE_API_URL=http://localhost:8000
```

The variable is picked up automatically by Vite. Do not commit this file — it is gitignored.

## Building for production

```bash
npm run build
# or
make build
```

This runs TypeScript compilation (`tsc -b`) followed by `vite build`. Output goes to `dist/`.

To preview the built output locally:

```bash
npm run preview
```

## Docker

The Dockerfile has three targets:

- **`dev`** — Runs `npm run dev` (Vite HMR) on port 5173.
- **`build`** — Compiles to `dist/`. `VITE_API_URL` is baked in as a sentinel string.
- **`production`** (default) — Serves `dist/` via nginx on port 80. The entrypoint script replaces the sentinel with the runtime value of `$VITE_API_URL` before nginx starts, so a single image can point to any backend without a rebuild.

```bash
# Build the production image
docker build -t chess-learner-ui .

# Run it
docker run -p 80:80 -e VITE_API_URL=http://your-backend:8000 chess-learner-ui
```

## Linting and type-checking

```bash
npm run typecheck    # TypeScript type check (no emit)
npm run lint:check   # ESLint (read-only)
npm run format:check # Prettier (read-only)

npm run lint         # ESLint with auto-fix
npm run format       # Prettier with auto-fix

make check           # lint:check + format:check + typecheck together
```

**Before opening a PR**, run `npm run build` — ESLint does not catch type errors and the CI build step must pass.

## Project structure

```
src/
├── App.tsx                   # Root component and top-level state
├── components/
│   ├── Board/                # ChessBoard wrapper (react-chessboard + resize + overlays)
│   ├── Controls/             # Mode selector, Strict toggle, Reset, PreviewToggles
│   ├── DrawTracker/          # 50-move / threefold / insufficient material bars
│   ├── MoveList/             # Move history, hints, analysis badges, nav bar
│   ├── OpeningPanel/         # Tabbed opening search/recent/favorites
│   ├── PgnLoader/            # PGN import modal
│   ├── PlayerArea/           # Player card: avatar, captures, autoplay toggle
│   └── Profile/              # ProfileMenu dropdown + Avatar
├── hooks/
│   ├── useChessGame.ts       # Central game logic (history-pointer model)
│   ├── useOpenings.ts        # Opening list + single-opening fetches
│   ├── useOpeningLibrary.ts  # Recent/favorites in localStorage
│   └── useProfile.ts         # User profile in localStorage
├── lib/
│   ├── aiPlayers.ts          # AI persona definitions
│   ├── captures.ts           # Captured pieces + material score from FEN
│   ├── draws.ts              # Draw condition detection
│   ├── moveClass.ts          # Display metadata for move classifications
│   └── pieces.ts             # Piece values and labels
├── services/
│   └── api.ts                # HTTP client (all backend calls)
└── types/
    └── chess.ts              # Shared TypeScript types
```

## CI/CD

GitHub Actions runs on every PR:
- **lint.yml** — typecheck + ESLint + Prettier
- **build.yml** — `npm run build` + Docker build check

On push to `main`, **publish.yml** pushes the production Docker image to `ghcr.io` with `latest` and `sha-*` tags.
