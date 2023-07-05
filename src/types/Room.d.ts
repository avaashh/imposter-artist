import { User } from "./User";

// Interface representing a GameRoom
interface GameRoom {
  roomId: string; // Unique ID of the room
  roomOwner: User; // User who owns the room
  settings: GameRoomSettings; // Settings of the game room
  playersInRoom: User[]; // Array of users currently in the room
}

// Interface representing the settings of a GameRoom
interface GameRoomSettings {
  maxPlayersInRoom: number; // Maximum number of players allowed in the room
  maxImpostersInRoom: number; // Maximum number of imposters allowed in the room
  language: string; // Language setting for the room
  drawingTime: number; // Time limit for drawing in the room in seconds
  rounds: number; // Number of rounds of games with different phrases
  drawingRoundsLimit: number; // Number of rounds in the game after which voting is enabled
  votingType: "once" | "continued";
  roomType: "public" | "private"; // Type of the room (public or private)
}
