import { Character, Player } from "../../types/User";
import * as actionTypes from "./redux-actions";

/*
    Storage = {
        // User Details
        player: {
            id: string; // Unique ID of the Player
            playerName: string; // Name of the Player
            character: Character; // Player's default character
            currentRoom?: GameRoom | null; // Current room player is playing in - can be null when not playing
        }
    }
*/

export interface ReduxState {
  player?: Player | null;
}

export interface ReduxAction {
  type: string;
  payload?: any;
}

const reducer = (state: ReduxState = {}, action: ReduxAction): ReduxState => {
  switch (action.type) {
    case actionTypes.updatePlayer:
      return {
        ...state,
        player: action.payload,
      };

    case actionTypes.changeUserCharacter:
      if (state.player !== undefined && state.player !== null) {
        return {
          ...state,
          player: { ...state.player, character: action.payload },
        };
      }
      return state;

    case actionTypes.playerUsernameChanged:
      if (state.player !== undefined && state.player !== null) {
        return {
          ...state,
          player: { ...state.player, playerName: action.payload.playerName },
        };
      }
      return state;

    default:
      return state;
  }
};

export default reducer;
