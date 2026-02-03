import { store } from "./store";
import * as actionTypes from "./redux-actions";

import {
  defaultCharacter,
  defaultPlayer,
  newPlayerId,
  newPlayerName,
} from "../defaultCreate";
import { Player } from "../../types/User";
import {
  GameResult,
  GameRoom,
  Phase,
  RoleAssignment,
  TurnState,
} from "../../types/Room";

export const StorePlayer = (player: Player) =>
  store.dispatch({
    type: actionTypes.updatePlayer,
    payload: player,
  });

export const StoreGameRoom = (gameRoom: GameRoom | null) =>
  store.dispatch({
    type: actionTypes.updateGameRoom,
    payload: gameRoom,
  });

export const ChangeCharacter = (
  characterIdentity: string,
  characterColor: string
) =>
  store.dispatch({
    type: actionTypes.changeUserCharacter,
    payload: defaultCharacter(characterIdentity, characterColor),
  });

export const UpdateName = (newName: string) =>
  store.dispatch({
    type: actionTypes.playerUsernameChanged,
    payload: { playerName: newName },
  });

export const StoreRole = (role: RoleAssignment | null) =>
  store.dispatch({ type: actionTypes.setRole, payload: role });

export const StoreTurn = (turn: TurnState | null) =>
  store.dispatch({ type: actionTypes.setTurn, payload: turn });

export const StorePhase = (phase: Phase | null) =>
  store.dispatch({ type: actionTypes.setPhase, payload: phase });

export const StoreGameResult = (result: GameResult | null) =>
  store.dispatch({ type: actionTypes.setGameResult, payload: result });

export const ResetGameMeta = () =>
  store.dispatch({ type: actionTypes.resetGameMeta });

export const ThisPlayer = () => {
  const player = store.getState().player;
  return player === undefined || player === null
    ? defaultPlayer({ id: newPlayerId(), playerName: newPlayerName() })
    : player;
};

export const CheckState = () => console.log(store.getState());
