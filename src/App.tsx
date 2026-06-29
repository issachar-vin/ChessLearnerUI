import { useState } from "react";
import { Toaster } from "react-hot-toast";
import { ChessBoard } from "./components/Board/ChessBoard";
import { Controls } from "./components/Controls/Controls";
import { MoveList } from "./components/MoveList/MoveList";
import { OpeningSelector } from "./components/OpeningSelector/OpeningSelector";
import { useChessGame } from "./hooks/useChessGame";
import { useOpening, useOpenings } from "./hooks/useOpenings";
import type { Mode, Side } from "./types/chess";

export default function App() {
  const [selectedOpeningId, setSelectedOpeningId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<Mode>("sparring");
  const [strict, setStrict] = useState(true);
  const [userSide, setUserSide] = useState<Side>("white");

  const { openings, loading } = useOpenings(search);
  const { opening } = useOpening(selectedOpeningId);

  const game = useChessGame(selectedOpeningId, mode, strict, userSide);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: "#1e293b", color: "#f1f5f9", border: "1px solid #334155" },
        }}
      />

      <header className="border-b border-slate-800/60 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="text-2xl select-none">♞</div>
          <div>
            <h1 className="font-playfair text-xl font-bold text-white tracking-tight">
              Chess Learner
            </h1>
            <p className="text-xs text-slate-500">Master openings, counters, and replies</p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex max-w-7xl mx-auto w-full gap-0">
        <aside className="w-72 shrink-0 flex flex-col border-r border-slate-800/60 bg-slate-900/30">
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Select Opening
            </h2>
            <div className="inline-flex rounded-md border border-slate-700/60 overflow-hidden text-xs">
              {(["white", "black"] as Side[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setUserSide(s)}
                  className={`px-2 py-1 capitalize ${
                    userSide === s ? "bg-purple-600/40 text-white" : "text-slate-400"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <OpeningSelector
            openings={openings}
            loading={loading}
            selectedId={selectedOpeningId}
            onSelect={setSelectedOpeningId}
            search={search}
            onSearchChange={setSearch}
          />
        </aside>

        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-8 py-8">
          {!selectedOpeningId ? (
            <div className="text-center animate-fade-in">
              <div className="text-6xl mb-4 opacity-20">♟</div>
              <h2 className="text-xl font-semibold text-slate-400">Select an opening to begin</h2>
              <p className="text-slate-600 text-sm mt-2">Search and pick a line from the sidebar</p>
            </div>
          ) : (
            <>
              <Controls
                mode={mode}
                onModeChange={setMode}
                strict={strict}
                onStrictChange={setStrict}
                canUndo={game.canUndo}
                canRedo={game.canRedo}
                onUndo={game.undo}
                onRedo={game.redo}
                onReset={game.reset}
                previewVisibility={game.previewVisibility}
                onPreviewChange={game.setPreviewVisibility}
              />
              <ChessBoard
                fen={game.fen}
                boardOrientation={userSide}
                squareHighlights={game.squareHighlights}
                customArrows={game.previewArrows}
                isAiThinking={game.isAiThinking}
                onPieceDrop={game.onPieceDrop}
                onSquareClick={game.onSquareClick}
              />
              <div className="text-xs text-slate-600 text-center">
                {game.isAiThinking
                  ? "Opponent is thinking…"
                  : game.isUserTurn
                    ? `Your turn — playing as ${userSide}`
                    : "Move a piece for either side, or press ▶"}
              </div>
            </>
          )}
        </div>

        <aside className="w-72 shrink-0 flex flex-col border-l border-slate-800/60 bg-slate-900/30 p-4">
          <MoveList
            history={game.history}
            pointer={game.pointer}
            onJump={game.jumpTo}
            analysis={game.analysis}
            trainingName={opening?.name ?? null}
          />
        </aside>
      </main>
    </div>
  );
}
