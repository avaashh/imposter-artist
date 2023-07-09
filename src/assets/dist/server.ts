import * as React from "react";

import { GameRoom } from "../../types/Room";
import { v4 as uuidv4 } from "uuid";
import { Player } from "../../types/User";

const endPoint = "localhost:8000";

interface ServerProps {
  server: Server | null;
}

export const SocketContext = React.createContext<ServerProps>({
  server: null,
});

export default class Server {
  // Properties
  socket: WebSocket;

  // Constructor
  constructor(onMessage: (m: any) => void, onConnect: () => void) {
    this.socket = new WebSocket(`ws://${endPoint}/ws`);
    this.socket.onopen = onConnect;
    this.socket.onmessage = onMessage;
  }

  // Methods
  getSocket = () => {
    return this.socket;
  };

  createGameRoom = (gameRoom: GameRoom) => {
    this.socket.send(
      JSON.stringify({
        id: `request-${uuidv4()}`,
        type: "createGame",
        payload: gameRoom,
      })
    );
  };

  joinRoomWithCode = (gameRoomId: string, player: Player) => {
    this.socket.send(
      JSON.stringify({
        id: `request-${uuidv4()}`,
        type: "joinGameWithCode",
        payload: {
          gameRoomId: gameRoomId,
          player: player,
        },
      })
    );
  };
}
