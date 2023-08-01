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
  character = defaultCharacter(newCharacterId(), newBackGroundColor()),
}: Player): Player => ({
  id: id,
  playerName: playerName,
  character: character,
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
  drawingTime = 2,
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
  roomOwner: Player
): GameRoom => ({
  roomId: roomId,
  roomOwner: roomOwner,
  settings: defaultGameRoomSettings(),
  playersInRoom: [roomOwner],
  gameState: "waiting",
});

/* Create random IDs or Keys required by webapp */
export const newRandomKey = (): string => {
  return uuidv4();
};

/* returns a n character pseudo-random alphanumeric code using Math.random */
const randomAlphaNumericCode = (n: number): string => {
  let code: string = "";

  for (let i = 0; i < n; i++) {
    let randInt: number = Math.floor(Math.random() * (10 + 26 + 26)); // Numbers, Lowercase, Uppercase

    if (randInt < 10) code += `${randInt}`;
    else if (randInt < 36)
      code += String.fromCharCode("a".charCodeAt(0) + (randInt - 10));
    else code += String.fromCharCode("A".charCodeAt(0) + (randInt - 36));
  }
  return code;
};

/* Two random keys combined to decrease probability of duplication */
export const newPlayerId = () => `player-${newRandomKey()}-${newRandomKey()}`;

/* 8 Character Pseudo-random Room ID */
export const newRoomId = (): string => randomAlphaNumericCode(8);

/* 8 Character Pseudo-random Room ID */
export const newPlayerName = (): string =>
  playerNameBase.names[Math.floor(Math.random() * playerNameBase.names.length)];

/* Character's Pseudo-random ID */
export const newCharacterId = () =>
  `${Math.floor(Math.random() * CharactersLen)}`;

/* Character's BackGroundColor in Hex */
export const newBackGroundColor = () =>
  BackGroundColors[Math.floor(Math.random() * BackGroundColorsLen)];
