import * as React from "react";

import { GameRoom } from "../../types/Room";
import { v4 as uuidv4 } from "uuid";
import { Player } from "../../types/User";
import { Stroke, DrawnStroke } from "../../types/Drawing";

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
  messageHandlers: ((m: any) => void)[];

  // Constructor
  constructor(onMessage: (m: any) => void, onConnect: () => void) {
    this.socket = new WebSocket(`ws://${endPoint}/ws`);
    this.socket.onopen = onConnect;

    this.messageHandlers = [onMessage];

    this.socket.onmessage = (m) =>
      this.messageHandlers.forEach((h) => h(JSON.parse(m.data)));
    this.socket.onclose = console.log;
    this.socket.onerror = () => window.location.replace("");
  }

  // Methods
  getSocket = () => {
    return this.socket;
  };

  addMessageHandler = (handler: (m: any) => void) => {
    if (!this.messageHandlers.includes(handler))
      this.messageHandlers.push(handler);
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

  postStrokeToServer = (user: Player, stroke: Stroke) => {
    const playersStroke: DrawnStroke = {
      owner: user,
      stroke: stroke,
    };

    console.log(playersStroke);
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

  startGame = (gameRoom: GameRoom | undefined) => {
    if (gameRoom !== undefined)
      this.socket.send(
        JSON.stringify({
          id: `request-${uuidv4()}`,
          type: "startGame",
          payload: { roomId: gameRoom.roomId },
        })
      );
  };
}
