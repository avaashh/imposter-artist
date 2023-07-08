// Redux files
import { store } from "./store";
import * as actionTypes from "./redux-actions";

// Modules
import {
  defaultCharacter,
  defaultPlayer,
  newPlayerId,
  newPlayerName,
} from "../defaultCreate";
import { Player } from "../../types/User";

export const StorePlayer = (player: Player) =>
  store.dispatch({
    type: actionTypes.updatePlayer,
    payload: player,
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

export const ThisPlayer = () => {
  const player = store.getState().player;
  return player === undefined || player === null
    ? defaultPlayer({ id: newPlayerId(), playerName: newPlayerName() })
    : player;
};

export const CheckState = () => console.log(store.getState());
