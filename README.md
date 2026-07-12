# ChessLearner UI

An open source tool for learning chess openings. Practice against an AI opponent that can follow any named opening line, challenge you with book moves, or play engine-best moves — all on an interactive board with real-time hints and post-game analysis.

## What it does

- **Browse 3,700+ named openings** (ECO A–E) from the lichess catalog, with search, recents, and favorites
- **Three training modes** — Guided (follows a specific opening line), Sparring (plays the most common book move), and Challenge (plays Stockfish's best move)
- **Colored arrow previews** showing what each mode would play next, so you can compare lines side-by-side
- **Post-game Stockfish review** with per-move accuracy scores and classifications (brilliant → blunder)
- **Free play and PGN import** for reviewing your own games
- **Autoplay** to watch an opening play itself out automatically
- User profile with a custom name, piece icon, or uploaded avatar (stored locally)

## Tech stack

| | |
|---|---|
| Framework | React 18 + TypeScript 5.5 |
| Build tool | Vite 5 |
| Styling | Tailwind CSS 3 (dark theme) |
| Chess logic | chess.js (move validation, PGN/FEN) |
| Board rendering | react-chessboard (drag-and-drop, highlights, arrows) |
| Notifications | react-hot-toast |

All state lives in React hooks — no Redux or external state library. No client-side router — single page.

## Prerequisites

- Node.js 20+
- The [ChessLearner API](../backend) running locally (or any deployed instance)

## Running locally

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set the API URL** (optional — defaults to `http://localhost:8000`)

   Create a `.env` file in the project root:

   ```
   VITE_API_URL=http://localhost:8000
   ```

3. **Start the dev server**

   ```bash
   npm run dev
   ```

   The app opens at `http://localhost:5173`.

## Building for production

```bash
npm run build
```

This runs `tsc -b` (type check) then `vite build`. The output goes to `dist/`.

To preview the production build locally:

```bash
npm run preview
```

## Docker

A multi-stage Dockerfile is included. The production image serves the built app with nginx and supports runtime API URL injection — you do not need to rebuild the image to point at a different backend.

```bash
# Build
docker build --target production -t chess-learner-ui .

# Run (inject the backend URL at container start)
docker run -p 80:80 -e VITE_API_URL=http://your-api-host:8000 chess-learner-ui
```

## Linting and formatting

```bash
npm run lint          # ESLint (auto-fix)
npm run lint:check    # ESLint (no writes — used in CI)
npm run format        # Prettier (auto-fix)
npm run format:check  # Prettier (no writes — used in CI)
npm run typecheck     # TypeScript type check only
```

Run `npm run build` before raising a PR — ESLint alone does not catch type errors.

## How it connects to the backend

All API calls go through `src/services/api.ts`. The base URL comes from `VITE_API_URL` (falls back to `http://localhost:8000`).

| Endpoint | Purpose |
|---|---|
| `GET /api/openings` | Search/list openings for the selector panels |
| `GET /api/openings/{id}` | Fetch a single opening's move list |
| `POST /api/game/analyze` | Get move hints and previews for the current position |
| `POST /api/game/ai-move` | Request the AI's next move |
| `POST /api/game/review` | Run Stockfish post-game analysis |

## Project structure

```
src/
├── App.tsx                  # Root layout (three-column: openings / board / moves)
├── components/              # UI components (Board, Controls, MoveList, OpeningPanel, …)
├── hooks/
│   ├── useChessGame.ts      # Core game state (history-pointer model)
│   ├── useOpenings.ts       # API-backed opening search
│   ├── useOpeningLibrary.ts # Recent/favorites per panel (localStorage)
│   └── useProfile.ts        # User name + avatar (localStorage)
├── services/
│   └── api.ts               # Typed HTTP client
├── lib/                     # Chess utilities (captures, draw detection, move classification)
└── types/
    └── chess.ts             # Shared TypeScript types
```
