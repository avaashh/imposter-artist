import {
  ResetGameMeta,
  StoreGameResult,
  StoreGameRoom,
  StorePhase,
  StoreRole,
  StoreTurn,
  ThisPlayer,
} from "../../utils/storage/storage-container";

type Navigate = (path: string) => void;
type Toast = (msg: string, options?: any) => void;

const toastOpts = {
  position: "top-right",
  autoClose: 4000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: "light",
};

const errorToast = (toast: Toast, msg: string | undefined) =>
  toast(msg || "Something went wrong", toastOpts);

export const handleIncomingMessages = (
  message: any,
  navigate: Navigate,
  toast: Toast
) => {
  if (!message || typeof message !== "object") return;

  const { type, payload } = message;
  if (!type) return;

  switch (type) {
    case "createGame":
    case "joinGameWithCode": {
      if (payload?.success) {
        StoreGameRoom(payload.gameRoom);
        navigate(`/lobby/${payload.gameRoom.roomId}`);
      } else {
        errorToast(toast, payload?.err);
      }
      return;
    }

    case "playerJoinedGame": {
      if (!payload?.success) return;
      const me = ThisPlayer();
      if (me.currentRoom && me.currentRoom.roomId === payload.roomId) {
        StoreGameRoom(payload.gameRoom ?? me.currentRoom);
      }
      return;
    }

    case "playerLeftGame": {
      if (!payload?.success) return;
      const me = ThisPlayer();
      if (me.currentRoom && me.currentRoom.roomId === payload.roomId) {
        StoreGameRoom(payload.gameRoom ?? me.currentRoom);
      }
      return;
    }

    case "ownerChanged": {
      const me = ThisPlayer();
      if (me.currentRoom && me.currentRoom.roomId === payload?.roomId) {
        StoreGameRoom({ ...me.currentRoom, roomOwner: payload.newOwner });
      }
      return;
    }

    case "gameSettingsUpdated": {
      const me = ThisPlayer();
      if (me.currentRoom && me.currentRoom.roomId === payload?.roomId) {
        StoreGameRoom({ ...me.currentRoom, settings: payload.settings });
      }
      return;
    }

    case "roleAssigned": {
      if (!payload?.success) return;
      StoreRole({
        isImposter: !!payload.isImposter,
        word: payload.word,
        roomId: payload.roomId,
      });
      return;
    }

    case "gameStarted": {
      if (!payload?.success) return;
      StorePhase("inProgress");
      StoreGameResult(null);
      const me = ThisPlayer();
      if (payload.gameRoom) {
        StoreGameRoom(payload.gameRoom);
      } else if (me.currentRoom) {
        StoreGameRoom({
          ...me.currentRoom,
          gameState: "inProgress",
          playerColors: payload.playerColors,
        });
      }
      navigate(`/play/${payload.roomId}`);
      return;
    }

    case "turnStart": {
      if (!payload?.success) return;
      StoreTurn({
        currentPlayerId: payload.currentPlayerId,
        round: payload.round,
        totalRounds: payload.totalRounds,
        turnDurationSecs: payload.turnDurationSecs,
        startedAt: Date.now(),
      });
      return;
    }

    case "phaseChange": {
      if (payload?.phase) StorePhase(payload.phase);
      return;
    }

    case "votingStarted": {
      StorePhase("voting");
      return;
    }

    case "gameOver": {
      if (!payload?.success) return;
      StorePhase("ended");
      StoreGameResult({
        imposterWon: payload.imposterWon,
        imposterPlayerId: payload.imposterPlayerId,
        secretWord: payload.secretWord,
        voteTally: payload.voteTally || {},
      });
      const me = ThisPlayer();
      if (me.currentRoom && payload.scores) {
        StoreGameRoom({ ...me.currentRoom, scores: payload.scores });
      }
      return;
    }

    case "roomReset": {
      ResetGameMeta();
      const me = ThisPlayer();
      if (me.currentRoom && payload?.gameRoom) {
        StoreGameRoom(payload.gameRoom);
      }
      if (payload?.roomId) navigate(`/lobby/${payload.roomId}`);
      return;
    }

    case "startGame":
    case "endTurn":
    case "sendVote":
    case "playAgain":
    case "leaveGame":
    case "updateGameSettings":
    case "sendStroke":
      // Acked, handled elsewhere (or no-op on the happy path).
      if (payload && payload.success === false) {
        errorToast(toast, payload.err);
      }
      return;

    default:
      return;
  }
};
