// Types
import { Player, Character } from "../types/User";
import { GameRoom, GameRoomSettings } from "../types/Room";

import playerNameBase from "../assets/dist/playerNames.json";

import {
  CharactersLen,
  BackGroundColors,
  BackGroundColorsLen,
} from "../assets/Characters";

// Identifiers
import { v4 as uuidv4 } from "uuid";

/* Create Default Variables of User-Defined types */
export const defaultPlayer = ({
  id,
  playerName,
  character = defaultCharacter(),
  currentRoom = null,
}: Player): Player => ({
  id: id,
  playerName: playerName,
  character: character,
  currentRoom: currentRoom,
});

export const defaultCharacter = (
  characterIdentity: string = "0",
  characterColor: string = "#FFFFFF"
): Character => ({
  characterIdentity: characterIdentity,
  characterColor: characterColor,
});

export const defaultGameRoomSettings = (
  maxPlayersInRoom = 8,
  maxImpostersInRoom = 1,
  language = "en",
  drawingTime = 3,
  rounds = 8,
  drawingRoundsLimit = 2,
  votingType: "once" | "continued" = "once",
  roomType: "public" | "private" = "private"
): GameRoomSettings => ({
  maxPlayersInRoom: maxPlayersInRoom,
  maxImpostersInRoom: maxImpostersInRoom,
  language: language,
  drawingTime: drawingTime,
  rounds: rounds,
  drawingRoundsLimit: drawingRoundsLimit,
  votingType: votingType,
  roomType: roomType,
});

export const defaultGameRoom = (
  roomId: string,
  roomOwner: string,
  playersInRoom: []
): GameRoom => ({
  roomId: roomId,
  roomOwner: roomOwner,
  settings: defaultGameRoomSettings(),
  playersInRoom: playersInRoom,
});

/* Create random IDs or Keys required by webapp */

/* returns a n character pseudo-random alphanumeric code (w/ symbols) using Math.random */
const randomAlphaNumericCode = (n: number): string => {
  let code: string = "";
  const symbols = ["!", "@", "#", "$", ">", "(", "^", ")", "<", "\\"];

  for (let i = 0; i < n; i++) {
    let randInt: number = Math.floor(
      Math.random() * (10 + 26 + 26 + symbols.length)
    ); // Numbers, Lowercase, Uppercase, Signs

    if (randInt < 10) code += `${randInt}`;
    else if (randInt < 36) code += "a" + (randInt - 10);
    else if (randInt < 62) code += "A" + (randInt - 36);
    else code += symbols[randInt - 62];
  }
  return code;
};

/* Two UUIDs combined to decrease probability of duplication */
export const newPlayerId = () => `player${uuidv4()}-${uuidv4()}`;

/* 8 Character Pseudo-random Room ID */
export const newRoomId = () => `room${randomAlphaNumericCode(8)}`;

/* 8 Character Pseudo-random Room ID */
export const newPlayerName = (): string =>
  playerNameBase.names[Math.floor(Math.random() * playerNameBase.names.length)];

/* Character's Pseudo-random ID */
export const newCharacterId = () =>
  `${Math.floor(Math.random() * CharactersLen)}`;

/* Character's BackGroundColor in Hex */
export const newBackGroundColor = () =>
  BackGroundColors[Math.floor(Math.random() * BackGroundColorsLen)];
