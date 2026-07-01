import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import { ChessBoard } from "./components/Board/ChessBoard";
import { Controls } from "./components/Controls/Controls";
import { PreviewToggles } from "./components/Controls/PreviewToggles";
import { DrawTracker } from "./components/DrawTracker/DrawTracker";
import { MoveList } from "./components/MoveList/MoveList";
import { OpeningPanel } from "./components/OpeningPanel/OpeningPanel";
import { PgnLoader } from "./components/PgnLoader/PgnLoader";
import { PlayerArea } from "./components/PlayerArea/PlayerArea";
import { Avatar } from "./components/Profile/Avatar";
import { ProfileMenu } from "./components/Profile/ProfileMenu";
import { Switch } from "./components/Switch/Switch";
import { Tooltip } from "./components/Tooltip/Tooltip";
import { HELP } from "./components/Tooltip/help";
import { useChessGame } from "./hooks/useChessGame";
import { useOpeningLibrary } from "./hooks/useOpeningLibrary";
import { useOpening, useOpenings } from "./hooks/useOpenings";
import { useProfile } from "./hooks/useProfile";
import { api } from "./services/api";
import { AI_PLAYERS } from "./lib/aiPlayers";
import { computeCaptures } from "./lib/captures";
import type { Mode, OpeningListItem, ReviewResponse, Side } from "./types/chess";

export default function App() {
  const [selectedOpeningId, setSelectedOpeningId] = useState<string | null>(null);
  const [aiOpeningId, setAiOpeningId] = useState<string | null>(null);
  const [aiDefault, setAiDefault] = useState(true);
  const [freePlay, setFreePlay] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [aiSearch, setAiSearch] = useState("");
  const [mode, setMode] = useState<Mode>("sparring");
  const [strict, setStrict] = useState(true);
  const [userSide, setUserSide] = useState<Side>("white");
  const [review, setReview] = useState<ReviewResponse | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const userOpenings = useOpenings(userSearch);
  const aiOpenings = useOpenings(aiSearch);
  const { opening } = useOpening(selectedOpeningId);
  const { opening: aiOpening } = useOpening(aiOpeningId);
  const userLibrary = useOpeningLibrary("user");
  const aiLibrary = useOpeningLibrary("ai");
  const { profile, save } = useProfile();

  const game = useChessGame(
    selectedOpeningId,
    mode,
    strict,
    userSide,
    opening?.moves ?? [],
    aiOpeningId,
    freePlay
  );

  const active = selectedOpeningId !== null || freePlay;

  // Stale review is cleared whenever the move list changes (a new move, a load,
  // or a reset); navigation keeps it (pointer changes but length doesn't).
  useEffect(() => setReview(null), [game.length]);

  const captures = computeCaptures(game.fen);
  const userIsWhite = userSide === "white";
  const userCaptured = userIsWhite ? captures.byWhite : captures.byBlack;
  const aiCaptured = userIsWhite ? captures.byBlack : captures.byWhite;
  const userScore = userIsWhite ? captures.whiteScore : captures.blackScore;
  const aiScore = userIsWhite ? captures.blackScore : captures.whiteScore;
  const aiPlayer = AI_PLAYERS[mode];
  const activePlayer: "user" | "ai" | null = game.result ? null : game.isUserTurn ? "user" : "ai";

  const sideOf = (moveCount: number): Side => (moveCount % 2 === 1 ? "white" : "black");
  const aiSide: Side = userSide === "white" ? "black" : "white";
  const userVisible = userOpenings.openings.filter((o) => sideOf(o.move_count) === userSide);
  const aiVisible = aiOpenings.openings.filter((o) => sideOf(o.move_count) === aiSide);

  const handleSelectSide = (s: Side) => {
    setUserSide(s);
    setSelectedOpeningId(null);
  };

  const handleSelect = (item: OpeningListItem) => {
    setFreePlay(false);
    setSelectedOpeningId(item.id);
    setUserSide(sideOf(item.move_count));
    userLibrary.addRecent(item);
  };

  const handleSelectAi = (item: OpeningListItem) => {
    setAiOpeningId(item.id);
    aiLibrary.addRecent(item);
  };

  // "Default" on = AI plays its mode (no opening bias), panel collapsed.
  const toggleAiDefault = () => {
    setAiDefault((d) => {
      if (!d) setAiOpeningId(null);
      return !d;
    });
  };

  const enterFreePlay = () => {
    setSelectedOpeningId(null);
    setFreePlay(true);
  };

  const handleLoadPgn = (moves: string[]) => {
    setSelectedOpeningId(null);
    setFreePlay(true);
    game.loadGame(moves);
  };

  const runReview = async () => {
    if (game.length === 0) return;
    setAnalyzing(true);
    try {
      const res = await api.game.review({ moves: game.history.map((m) => m.uci) });
      setReview(res);
    } catch {
      setReview(null);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col">
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: "#1e293b", color: "#f1f5f9", border: "1px solid #334155" },
        }}
      />

      <header className="border-b border-slate-800/60 px-6 py-4 shrink-0">
        <div className="flex items-center gap-3">
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

      <main className="flex-1 min-h-0 flex w-full">
        <aside className="w-72 shrink-0 flex flex-col min-h-0 border-r border-slate-800/60 bg-slate-900/30">
          <div className="p-2 flex gap-2 border-b border-slate-800/60 shrink-0">
            <button
              onClick={enterFreePlay}
              className={`flex-1 rounded-md py-1.5 text-xs font-medium border transition-colors ${
                freePlay
                  ? "bg-purple-600/40 border-purple-500 text-white"
                  : "border-slate-700 text-slate-300 hover:bg-slate-800"
              }`}
            >
              ♟ Free play
            </button>
            <PgnLoader
              onLoad={handleLoadPgn}
              label="Load PGN"
              className="flex-1 rounded-md py-1.5 text-xs font-medium border border-slate-700 text-slate-300 hover:bg-slate-800"
            />
          </div>

          <div className="flex-1 min-h-0 flex flex-col divide-y divide-slate-800/60">
            {aiDefault ? (
              <div className="shrink-0 px-3 py-3 flex items-center justify-between gap-2">
                <Tooltip {...HELP.aiOpening}>
                  <div className="flex items-center gap-1.5 cursor-help">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      AI opponent
                    </h2>
                  </div>
                </Tooltip>
                <Switch checked label="Default" onChange={toggleAiDefault} />
              </div>
            ) : (
              <OpeningPanel
                title="AI opponent"
                accentText="text-rose-400"
                accentDot="bg-rose-400"
                subtitle={aiOpening ? aiOpening.name : "No bias — plays its mode"}
                headerRight={<Switch checked={false} label="Default" onChange={toggleAiDefault} />}
                openings={aiVisible}
                recent={aiLibrary.recent}
                favorites={aiLibrary.favorites}
                loading={aiOpenings.loading}
                selectedId={aiOpeningId}
                search={aiSearch}
                onSearchChange={setAiSearch}
                onSelect={handleSelectAi}
                isFavorite={aiLibrary.isFavorite}
                onToggleFavorite={aiLibrary.toggleFavorite}
              />
            )}
            <OpeningPanel
              title="You"
              accentText="text-purple-400"
              accentDot="bg-purple-400"
              subtitle={opening ? opening.name : "Pick a line to drill"}
              headerRight={
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
              }
              openings={userVisible}
              recent={userLibrary.recent}
              favorites={userLibrary.favorites}
              loading={userOpenings.loading}
              selectedId={selectedOpeningId}
              search={userSearch}
              onSearchChange={setUserSearch}
              onSelect={handleSelect}
              isFavorite={userLibrary.isFavorite}
              onToggleFavorite={userLibrary.toggleFavorite}
            />
          </div>
        </aside>

        <div className="flex-1 min-h-0 flex flex-col items-center gap-2 px-6 py-4 overflow-y-auto">
          {!active ? (
            <div className="m-auto text-center animate-fade-in">
              <div className="text-6xl mb-4 opacity-20">♟</div>
              <h2 className="text-xl font-semibold text-slate-400">Choose how to play</h2>
              <p className="text-slate-600 text-sm mt-2">
                Pick a line from the sidebar, start Free play, or load a PGN to analyse.
              </p>
            </div>
          ) : (
            <>
              <Controls
                mode={mode}
                onModeChange={setMode}
                strict={strict}
                onStrictChange={setStrict}
                onReset={game.reset}
              />

              <div className="w-full flex-1 min-h-0 flex flex-col items-center justify-center gap-2">
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
                <div className="flex-1 min-h-0 w-full flex items-center justify-center">
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
                </div>
                <PlayerArea
                  name={profile.name}
                  icon={<Avatar icon={profile.icon} size={40} />}
                  captured={userCaptured}
                  capturedColor={userIsWhite ? "b" : "w"}
                  scoreDiff={userScore - aiScore}
                  isActive={activePlayer === "user"}
                />
              </div>

              <PreviewToggles
                previewVisibility={game.previewVisibility}
                onPreviewChange={game.setPreviewVisibility}
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
              canUndo={game.canUndo}
              canRedo={game.canRedo}
              nextIsAutoPlay={game.nextIsAutoPlay}
              autoPlay={game.autoPlay}
              onToggleAutoPlay={() => game.setAutoPlay(!game.autoPlay)}
              onUndo={game.undo}
              onRedo={game.redo}
              review={review}
              analyzing={analyzing}
              canAnalyze={active && game.length > 0}
              onAnalyze={runReview}
            />
          </div>
          {active && <DrawTracker fen={game.fen} history={game.history.slice(0, game.pointer)} />}
        </aside>
      </main>
    </div>
  );
}
