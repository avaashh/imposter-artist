import { Player } from "./User";
import { ColorHex } from "react-countdown-circle-timer";

export type Phase = "waiting" | "inProgress" | "voting" | "ended";

// Interface representing a GameRoom
interface GameRoom {
  roomId: string;
  roomOwner: Player;
  settings: GameRoomSettings;
  playersInRoom: Player[];
  gameState: Phase;
  playerColors?: ColorHex[];
  round?: number;
  totalRounds?: number;
  turnIndex?: number;
  scores?: Record<string, number>;
}

// Interface representing the settings of a GameRoom
interface GameRoomSettings {
  maxPlayersInRoom: number;
  maxImpostersInRoom: number;
  language: string;
  drawingTime: number;
  rounds: number;
  drawingRoundsLimit: number;
  votingType: "once" | "continued";
  roomType: "public" | "private";
}

// Role context we receive privately on game start.
export interface RoleAssignment {
  isImposter: boolean;
  word?: string;
  roomId: string;
}

export interface TurnState {
  currentPlayerId: string;
  round: number;
  totalRounds: number;
  turnDurationSecs: number;
  startedAt: number;
}

export interface GameResult {
  imposterWon: boolean;
  imposterPlayerId: string;
  secretWord: string;
  voteTally: Record<string, number>;
}
