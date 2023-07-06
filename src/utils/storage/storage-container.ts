// Redux files
import { store } from "./store";
import * as actionTypes from "./redux-actions";

// Modules
import { defaultCharacter, defaultPlayer } from "../defaultCreate";

export const StorePlayer = (playerID: string, playerName: string) =>
  store.dispatch({
    type: actionTypes.updatePlayer,
    payload: defaultPlayer({
      id: playerID,
      playerName: playerName,
    }),
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

export const ThisPlayer = () => store.getState().player;

export const CheckState = () => console.log(store.getState());
