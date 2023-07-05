// Redux files
import { store } from "./store";
import * as actionTypes from "./redux-actions";

// Modules
import { defaultPlayer } from "../defaultCreate";

export const StorePlayer = (playerID: string, playerName: string) =>
  store.dispatch({
    type: actionTypes.createPlayer,
    payload: defaultPlayer({
      id: playerID,
      playerName: playerName,
    }),
  });

export const ThisPlayer = () => store.getState().player;

export const CheckState = () => console.log(store.getState());
