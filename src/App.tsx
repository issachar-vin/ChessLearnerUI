import { useState } from "react";
import { Toaster } from "react-hot-toast";
import { ChessBoard } from "./components/Board/ChessBoard";
import { Controls } from "./components/Controls/Controls";
import { ImportOpening } from "./components/ImportOpening/ImportOpening";
import { MoveList } from "./components/MoveList/MoveList";
import { OpeningSelector } from "./components/OpeningSelector/OpeningSelector";
import { useChessGame } from "./hooks/useChessGame";
import { useOpening, useOpenings } from "./hooks/useOpenings";

export default function App() {
  const [selectedOpeningId, setSelectedOpeningId] = useState<string | null>(null);
  const { openings, loading, refetch } = useOpenings();
  const { opening } = useOpening(selectedOpeningId);

  const userPlays = opening?.user_plays ?? "white";

  const {
    gameState,
    analysis,
    squareHighlights,
    counteringEnabled,
    isAiThinking,
    onPlayerMove,
    onPieceDragBegin,
    onPieceDragEnd,
    onSquareClick,
    setCounteringEnabled,
    reset,
  } = useChessGame(selectedOpeningId, userPlays);

  const handleSelectOpening = (id: string) => {
    setSelectedOpeningId(id);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: "#1e293b", color: "#f1f5f9", border: "1px solid #334155" },
        }}
      />

      {/* Header */}
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

      {/* Main layout */}
      <main className="flex-1 flex max-w-7xl mx-auto w-full gap-0">
        {/* Sidebar — opening selector */}
        <aside className="w-72 shrink-0 flex flex-col border-r border-slate-800/60 bg-slate-900/30">
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Select Opening
            </h2>
          </div>
          <OpeningSelector
            openings={openings}
            loading={loading}
            selectedId={selectedOpeningId}
            onSelect={handleSelectOpening}
          />
          <ImportOpening onImported={() => void refetch()} />
        </aside>

        {/* Center — board */}
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-8 py-8">
          {!selectedOpeningId ? (
            <div className="text-center animate-fade-in">
              <div className="text-6xl mb-4 opacity-20">♟</div>
              <h2 className="text-xl font-semibold text-slate-400">Select an opening to begin</h2>
              <p className="text-slate-600 text-sm mt-2">
                Choose from the sidebar or import your own PGN
              </p>
            </div>
          ) : (
            <>
              <Controls
                counteringEnabled={counteringEnabled}
                onToggleCountering={setCounteringEnabled}
                onReset={reset}
                isPlaying={gameState.status === "playing"}
              />
              <ChessBoard
                fen={gameState.fen}
                boardOrientation={userPlays}
                squareHighlights={squareHighlights}
                isPlayerTurn={gameState.isPlayerTurn}
                isAiThinking={isAiThinking}
                onPieceDrop={onPlayerMove}
                onPieceDragBegin={onPieceDragBegin}
                onPieceDragEnd={onPieceDragEnd}
                onSquareClick={onSquareClick}
              />
              <div className="text-xs text-slate-600 text-center">
                {gameState.isPlayerTurn
                  ? isAiThinking
                    ? ""
                    : `Your turn — playing as ${userPlays}`
                  : "Opponent is thinking..."}
              </div>
            </>
          )}
        </div>

        {/* Right panel — moves + hints */}
        <aside className="w-72 shrink-0 flex flex-col border-l border-slate-800/60 bg-slate-900/30 p-4">
          <MoveList
            moveHistory={gameState.moveHistory}
            analysis={analysis}
            isInOpening={gameState.isInOpening}
            openingName={opening?.name ?? null}
            openingDescription={opening?.description ?? null}
          />
        </aside>
      </main>
    </div>
  );
}
