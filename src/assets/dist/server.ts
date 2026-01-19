import * as React from "react";

import { GameRoom, GameRoomSettings } from "../../types/Room";
import { v4 as uuidv4 } from "uuid";
import { Player } from "../../types/User";
import { Stroke } from "../../types/Drawing";

type MessageHandler = (m: any) => void;

const resolveWsUrl = (): string => {
  const override = process.env.REACT_APP_WS_URL;
  if (override) return override;

  if (typeof window !== "undefined" && window.location) {
    const { protocol, hostname, port } = window.location;
    const wsProtocol = protocol === "https:" ? "wss:" : "ws:";
    // Dev convenience: React dev server on :3000 → Go server on :8000
    const wsPort = port === "3000" || port === "" ? "8000" : port;
    const hostPart = wsPort ? `${hostname}:${wsPort}` : hostname;
    return `${wsProtocol}//${hostPart}/ws`;
  }

  return "ws://localhost:8000/ws";
};

interface ServerProps {
  server: Server | null;
}

export const SocketContext = React.createContext<ServerProps>({
  server: null,
});

export default class Server {
  socket: WebSocket;
  private messageHandlers: MessageHandler[];
  private closedByClient = false;

  constructor(onMessage: MessageHandler, onConnect: () => void) {
    this.socket = new WebSocket(resolveWsUrl());
    this.socket.onopen = onConnect;

    this.messageHandlers = [onMessage];

    this.socket.onmessage = (m) => {
      let parsed: any;
      try {
        parsed = JSON.parse(m.data);
      } catch (e) {
        console.warn("Server sent non-JSON payload", e);
        return;
      }
      // iterate a snapshot so handlers that unsubscribe mid-dispatch don't trip us
      [...this.messageHandlers].forEach((h) => h(parsed));
    };

    this.socket.onclose = () => {
      if (!this.closedByClient) console.log("WebSocket closed by server");
    };
    this.socket.onerror = (e) => {
      console.warn("WebSocket error", e);
    };
  }

  getSocket = () => this.socket;

  addMessageHandler = (handler: MessageHandler): (() => void) => {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter((h) => h !== handler);
    };
  };

  close = () => {
    this.closedByClient = true;
    if (
      this.socket.readyState === WebSocket.OPEN ||
      this.socket.readyState === WebSocket.CONNECTING
    ) {
      this.socket.close();
    }
  };

  private send = (type: string, payload: unknown) => {
    if (this.socket.readyState !== WebSocket.OPEN) return;
    this.socket.send(
      JSON.stringify({ id: `request-${uuidv4()}`, type, payload })
    );
  };

  createGameRoom = (gameRoom: GameRoom) => this.send("createGame", gameRoom);

  postStrokeToServer = (user: Player, stroke: Stroke) =>
    this.send("sendStroke", {
      stroke,
      roomId: user.currentRoom?.roomId,
    });

  joinRoomWithCode = (gameRoomId: string, player: Player) =>
    this.send("joinGameWithCode", { gameRoomId, player });

  leaveRoom = (roomId: string) => this.send("leaveGame", { roomId });

  startGame = (gameRoom: GameRoom | undefined) => {
    if (gameRoom !== undefined)
      this.send("startGame", { roomId: gameRoom.roomId });
  };

  endTurn = (roomId: string) => this.send("endTurn", { roomId });

  sendVote = (roomId: string, votedPlayerId: string) =>
    this.send("sendVote", { roomId, votedPlayerId });

  playAgain = (roomId: string) => this.send("playAgain", { roomId });

  updateSettings = (roomId: string, settings: Partial<GameRoomSettings>) =>
    this.send("updateGameSettings", { roomId, settings });
}
