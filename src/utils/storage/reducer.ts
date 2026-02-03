import { Player } from "../../types/User";
import { GameResult, Phase, RoleAssignment, TurnState } from "../../types/Room";
import * as actionTypes from "./redux-actions";

export interface ReduxState {
  player?: Player | null;
  role?: RoleAssignment | null;
  turn?: TurnState | null;
  phase?: Phase | null;
  result?: GameResult | null;
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

    case actionTypes.updateGameRoom:
      if (state.player !== undefined && state.player !== null)
        return {
          ...state,
          player: { ...state.player, currentRoom: action.payload },
        };
      return state;

    case actionTypes.setRole:
      return { ...state, role: action.payload };

    case actionTypes.setTurn:
      return { ...state, turn: action.payload };

    case actionTypes.setPhase:
      return { ...state, phase: action.payload };

    case actionTypes.setGameResult:
      return { ...state, result: action.payload };

    case actionTypes.resetGameMeta:
      return {
        ...state,
        role: null,
        turn: null,
        phase: null,
        result: null,
      };

    default:
      return state;
  }
};

export default reducer;
