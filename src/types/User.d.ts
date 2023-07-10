import { GameRoom } from "./Room";

// Interface representing a Player
export interface Player {
  id: string; // Unique ID of the Player
  playerName: string; // Name of the Player
  character?: Character; // Player's default character
  currentRoom?: GameRoom;
}

// Interface representing a Character
export interface Character {
  characterIdentity: string; // Identity of the character's svg
  characterColor: string; // Color of the character (in hex format)
}
