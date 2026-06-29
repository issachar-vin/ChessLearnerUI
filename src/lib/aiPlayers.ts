import type { Mode } from "../types/chess";

export interface AiPlayer {
  name: string;
  icon: string;
  mode: string;
  blurb: string;
}

// Tongue-in-cheek personas for each opponent mode.
export const AI_PLAYERS: Record<Mode, AiPlayer> = {
  guided: {
    name: "Sensei Pawl",
    icon: "🧙",
    mode: "Guided",
    blurb: "Holds your hand down the line",
  },
  sparring: {
    name: "Rocky Pawlboa",
    icon: "🥊",
    mode: "Sparring",
    blurb: "Trades blows by the book",
  },
  challenge: {
    name: "Magnus Carlsen",
    icon: "👑",
    mode: "Challenge",
    blurb: "Plays the engine's best, good luck",
  },
};
