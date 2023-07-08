import * as React from "react";

import { GameRoom } from "../../types/Room";
import { v4 as uuidv4 } from "uuid";

const endPoint = "localhost:8000";
const handleIncomingContact = console.log;

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
  constructor(onConnect: () => void) {
    this.socket = new WebSocket(`ws://${endPoint}/ws`);
    this.socket.onopen = onConnect;
    this.socket.onmessage = handleIncomingContact;
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
}
