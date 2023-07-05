import { Player } from "../../types/User";
import * as actionTypes from "./redux-actions";

/*
    Storage = {
        // User Details
        player: {
            id: string; // Unique ID of the Player
            name: string; // Name of the Player
            character: Character; // Player's default character
            currentRoom?: GameRoom | null; // Current room player is playing in - can be null when not playing
        }
    }
*/

interface ReduxState {
  player?: Player | null;
}

interface ReduxAction {
  type: string;
  payload?: any;
}

const reducer = (state: ReduxState = {}, action: ReduxAction): ReduxState => {
  switch (action.type) {
    case actionTypes.createPlayer:
      if (state.player !== null)
        return {
          ...state,
          player: state.player ? { ...state.player } : null,
        };
      else
        return {
          ...state,
          player: action.payload,
        };
    default:
      return state;
  }
};

export default reducer;
