import { useState } from "react";
import { Toaster } from "react-hot-toast";
import { ChessBoard } from "./components/Board/ChessBoard";
import { Controls } from "./components/Controls/Controls";
import { DrawTracker } from "./components/DrawTracker/DrawTracker";
import { MoveList } from "./components/MoveList/MoveList";
import { OpeningSelector } from "./components/OpeningSelector/OpeningSelector";
import { PlayerArea } from "./components/PlayerArea/PlayerArea";
import { Avatar } from "./components/Profile/Avatar";
import { ProfileMenu } from "./components/Profile/ProfileMenu";
import { Tooltip } from "./components/Tooltip/Tooltip";
import { HELP } from "./components/Tooltip/help";
import { useChessGame } from "./hooks/useChessGame";
import { useOpeningLibrary } from "./hooks/useOpeningLibrary";
import { useOpening, useOpenings } from "./hooks/useOpenings";
import { useProfile } from "./hooks/useProfile";
import { AI_PLAYERS } from "./lib/aiPlayers";
import { computeCaptures } from "./lib/captures";
import type { Mode, OpeningListItem, Side } from "./types/chess";

export default function App() {
  const [selectedOpeningId, setSelectedOpeningId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<Mode>("sparring");
  const [strict, setStrict] = useState(true);
  const [userSide, setUserSide] = useState<Side>("white");

  const { openings, loading } = useOpenings(search);
  const { opening } = useOpening(selectedOpeningId);
  const library = useOpeningLibrary();
  const { profile, save } = useProfile();

  const game = useChessGame(selectedOpeningId, mode, strict, userSide, opening?.moves ?? []);

  // Captured material from the shown position, split into the user's and the
  // AI's haul. White's captures are the missing black pieces, and vice versa.
  const captures = computeCaptures(game.fen);
  const userIsWhite = userSide === "white";
  const userCaptured = userIsWhite ? captures.byWhite : captures.byBlack;
  const aiCaptured = userIsWhite ? captures.byBlack : captures.byWhite;
  const userScore = userIsWhite ? captures.whiteScore : captures.blackScore;
  const aiScore = userIsWhite ? captures.blackScore : captures.whiteScore;
  const aiPlayer = AI_PLAYERS[mode];
  const activePlayer: "user" | "ai" | null = game.result ? null : game.isUserTurn ? "user" : "ai";

  // A line ends on its characteristic move, so ply-count parity gives the side
  // the opening belongs to: odd plies → White, even → Black. The side toggle
  // both picks the colour you play and filters the list to that colour's lines.
  const sideOf = (moveCount: number): Side => (moveCount % 2 === 1 ? "white" : "black");
  const visibleOpenings = openings.filter((o) => sideOf(o.move_count) === userSide);

  const handleSelectSide = (s: Side) => {
    setUserSide(s);
    setSelectedOpeningId(null);
  };

  // Selecting (incl. from favorites/recent, which span both sides) records it
  // as recently played and aligns the board to that opening's side.
  const handleSelect = (item: OpeningListItem) => {
    setSelectedOpeningId(item.id);
    setUserSide(sideOf(item.move_count));
    library.addRecent(item);
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col">
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
          <div className="ml-auto">
            <ProfileMenu profile={profile} onSave={save} />
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 flex max-w-7xl mx-auto w-full gap-0">
        <aside className="w-72 shrink-0 flex flex-col min-h-0 border-r border-slate-800/60 bg-slate-900/30">
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Select Opening
            </h2>
            <Tooltip {...HELP.side}>
              <div className="inline-flex rounded-md border border-slate-700/60 overflow-hidden text-xs">
                {(["white", "black"] as Side[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSelectSide(s)}
                    className={`px-2 py-1 capitalize ${
                      userSide === s ? "bg-purple-600/40 text-white" : "text-slate-400"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </Tooltip>
          </div>
          <OpeningSelector
            openings={visibleOpenings}
            recent={library.recent}
            favorites={library.favorites}
            loading={loading}
            selectedId={selectedOpeningId}
            onSelect={handleSelect}
            search={search}
            onSearchChange={setSearch}
            isFavorite={library.isFavorite}
            onToggleFavorite={library.toggleFavorite}
          />
        </aside>

        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-start gap-5 px-8 py-8">
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
              <div className="flex items-center gap-2 text-sm">
                {game.result ? (
                  <span className="font-semibold text-purple-300 capitalize">
                    {game.result === "checkmate" ? `Checkmate — ${game.winner} wins` : game.result}
                  </span>
                ) : (
                  <>
                    <span
                      className={`w-3 h-3 rounded-full border ${
                        game.sideToMove === "w"
                          ? "bg-slate-100 border-slate-400"
                          : "bg-slate-900 border-slate-500"
                      }`}
                    />
                    <span className="text-slate-200">
                      {game.sideToMove === "w" ? "White" : "Black"} to move
                    </span>
                    <span className="text-slate-500 text-xs">
                      {game.isAiThinking
                        ? "(opponent thinking…)"
                        : game.isUserTurn
                          ? "(you)"
                          : "(opponent)"}
                    </span>
                    {game.inCheck && (
                      <span className="text-[11px] font-semibold bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded animate-pulse">
                        Check
                      </span>
                    )}
                  </>
                )}
              </div>
              <PlayerArea
                name={aiPlayer.name}
                subtitle={aiPlayer.mode}
                icon={
                  <span className="inline-flex items-center justify-center shrink-0 w-10 h-10 rounded-full bg-slate-800 border border-slate-600 text-xl">
                    {aiPlayer.icon}
                  </span>
                }
                captured={aiCaptured}
                capturedColor={userIsWhite ? "w" : "b"}
                scoreDiff={aiScore - userScore}
                isActive={activePlayer === "ai"}
              />
              <ChessBoard
                fen={game.fen}
                boardOrientation={userSide}
                squareHighlights={game.squareHighlights}
                customArrows={game.previewArrows}
                isAiThinking={game.isAiThinking}
                result={game.result}
                winner={game.winner}
                onPieceDrop={game.onPieceDrop}
                onSquareClick={game.onSquareClick}
              />
              <PlayerArea
                name={profile.name}
                icon={<Avatar icon={profile.icon} size={40} />}
                captured={userCaptured}
                capturedColor={userIsWhite ? "b" : "w"}
                scoreDiff={userScore - aiScore}
                isActive={activePlayer === "user"}
              />
            </>
          )}
        </div>

        <aside className="w-72 shrink-0 flex flex-col min-h-0 overflow-hidden border-l border-slate-800/60 bg-slate-900/30 p-4 gap-3">
          <div className="flex-1 min-h-0">
            <MoveList
              history={game.history}
              pointer={game.pointer}
              onJump={game.jumpTo}
              analysis={game.analysis}
              guidedNext={game.guidedNext}
              trainingName={opening?.name ?? null}
            />
          </div>
          {selectedOpeningId && (
            <DrawTracker fen={game.fen} history={game.history.slice(0, game.pointer)} />
          )}
        </aside>
      </main>
    </div>
  );
}
