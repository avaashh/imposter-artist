import React from "react";
import { useSelector } from "react-redux";

import Canvas from "../Canvas";

import { useWindowDimensions } from "../../utils/windows";

import { toast, ToastContainer } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";

import "../styles/GameCanvas.css";
import { Player } from "../../types/User";
import { SocketContext } from "../../assets/dist/server";
import { Point } from "../../utils/bezierInterpolation";
import { ReduxState } from "../../utils/storage/reducer";
import { DefaultButton } from "../Buttons";
import { SmallLogoHeader } from "../Logo";

import VotingScreen from "./VotingScreen";
import GameOverScreen from "./GameOverScreen";

interface PlayerChipProps {
  player: Player;
  color?: string;
  isOwner: boolean;
  isDrawer: boolean;
  isYou: boolean;
}

const PlayerChip: React.FC<PlayerChipProps> = ({
  player,
  color,
  isOwner,
  isDrawer,
  isYou,
}) => (
  <div className={`chip ${isDrawer ? "chip-active" : ""}`}>
    <div
      className="chip-dot"
      style={{ backgroundColor: color ?? "#cfc2ea" }}
      aria-hidden
    />
    <div className="chip-body">
      <span className="chip-name">
        {player.playerName}
        {isYou && <span className="chip-you"> (you)</span>}
        {isOwner && <span className="chip-crown" aria-label="host">★</span>}
      </span>
      <span className="chip-role">
        {isDrawer ? "drawing…" : "watching"}
      </span>
    </div>
  </div>
);

const GameCanvas: React.FC = () => {
  const navigate = useNavigate();
  const { gameID } = useParams();

  const player = useSelector((s: ReduxState) => s.player);
  const phase = useSelector((s: ReduxState) => s.phase);
  const turn = useSelector((s: ReduxState) => s.turn);
  const role = useSelector((s: ReduxState) => s.role);

  const currentGame = player?.currentRoom;
  const { server } = React.useContext(SocketContext);

  React.useEffect(() => {
    if (currentGame === undefined || currentGame === null) {
      navigate(`/?joingame=${gameID}`);
    }
  }, [currentGame, gameID, navigate]);

  const { width, height } = useWindowDimensions();
  const canvasRef = React.useRef<HTMLDivElement>(null);
  const [size, setSize] = React.useState(0);

  // The single source of truth for what's on the canvas: every completed
  // stroke in this game, in the order they landed on the server. Both the
  // drawer's local strokes and everyone else's broadcast strokes flow
  // through here so rendering stays consistent across clients.
  const [strokes, setStrokes] = React.useState<Point[][]>([]);
  // Live preview of the remote drawer's stroke as they're drawing it. Built
  // up from strokeProgress deltas and cleared once the completed stroke
  // arrives via sendStroke (which commits it into `strokes`).
  const [remoteInProgress, setRemoteInProgress] = React.useState<Point[] | null>(null);

  React.useEffect(() => {
    if (!canvasRef.current) return;
    const cw = canvasRef.current.clientWidth;
    const ch = canvasRef.current.clientHeight;
    // Leave a little room around the canvas card for the frame/shadow.
    setSize(Math.max(200, Math.min(cw, ch) - 24));
  }, [width, height]);

  const isMyTurn =
    !!player && !!turn && turn.currentPlayerId === player.id && phase === "inProgress";

  // Reset the canvas only when a fresh game begins. Strokes persist across
  // turns within a single game so every player is contributing to the same
  // drawing.
  React.useEffect(() => {
    if (phase === "inProgress") {
      setStrokes([]);
      setRemoteInProgress(null);
    }
  }, [phase]);

  // Any time the drawer changes, the previous drawer's (unfinished) preview
  // is no longer meaningful. Drop it so the new drawer starts with a clean
  // live layer.
  React.useEffect(() => {
    setRemoteInProgress(null);
  }, [turn?.currentPlayerId]);

  React.useEffect(() => {
    if (phase !== "inProgress") return;
    if (isMyTurn) {
      toast("Your turn to draw!", {
        position: "top-center",
        autoClose: 1800,
      });
    }
  }, [turn?.currentPlayerId, phase, isMyTurn]);

  React.useEffect(() => {
    if (!server) return;
    return server.addMessageHandler((message: any) => {
      if (message.type === "sendStroke" && message.payload?.success) {
        if (message.payload.sentStroke) {
          setStrokes((prev) => [...prev, message.payload.sentStroke]);
          setRemoteInProgress(null);
        }
      }
      if (message.type === "strokeProgress" && message.payload?.success) {
        const points: Point[] | undefined = message.payload.points;
        if (!points || points.length === 0) return;
        if (message.payload.isStart) {
          setRemoteInProgress(points);
        } else {
          setRemoteInProgress((prev) => (prev ? [...prev, ...points] : points));
        }
      }
    });
  }, [server]);

  const handleLocalStroke = React.useCallback((stroke: Point[]) => {
    setStrokes((prev) => [...prev, stroke]);
  }, []);

  if (!server) return <></>;
  if (!player || !currentGame) return <></>;

  if (phase === "voting") return <VotingScreen />;
  if (phase === "ended") return <GameOverScreen />;

  const playerIdx = currentGame.playersInRoom.map((v) => v.id).indexOf(player.id);
  const drawingBoardColor = currentGame.playerColors
    ? currentGame.playerColors[playerIdx]
    : "#000";

  const currentDrawer = turn
    ? currentGame.playersInRoom.find((p) => p.id === turn.currentPlayerId)
    : undefined;

  const wordValue = role ? (role.isImposter ? "???" : role.word ?? "") : "";

  return (
    <div className="draw-scene">
      <ToastContainer />

      <header className="draw-header">
        <div className="draw-header-left">
          <SmallLogoHeader />
          <div className="draw-meta">
            <span className="meta-round">
              Round {turn?.round ?? 1} / {turn?.totalRounds ?? currentGame.settings.drawingRoundsLimit}
            </span>
            <span className="meta-drawer">
              {currentDrawer
                ? isMyTurn
                  ? "your turn"
                  : `${currentDrawer.playerName} is drawing`
                : "…"}
            </span>
          </div>
        </div>
        <div className="draw-word">
          <span className="word-label">word</span>
          <span className="word-value">{wordValue}</span>
          {role?.isImposter && (
            <span className="word-aside">you're the imposter</span>
          )}
        </div>
      </header>

      <main className="draw-main">
        <aside className="draw-players">
          {currentGame.playersInRoom.map((p, i) => (
            <PlayerChip
              key={p.id}
              player={p}
              color={currentGame.playerColors?.[i]}
              isOwner={p.id === currentGame.roomOwner.id}
              isDrawer={p.id === turn?.currentPlayerId}
              isYou={p.id === player.id}
            />
          ))}
        </aside>

        <div className="canvas-wrap" ref={canvasRef}>
          <div className="canvas-card">
            {size > 0 && (
              <Canvas
                player={player}
                size={size}
                drawingEnabled={isMyTurn}
                drawColor={drawingBoardColor}
                server={server}
                strokes={strokes}
                remoteInProgress={isMyTurn ? null : remoteInProgress}
                onLocalStroke={handleLocalStroke}
              />
            )}
          </div>
          {!isMyTurn && (
            <div className="canvas-overlay-hint">
              {currentDrawer
                ? `${currentDrawer.playerName} is drawing — watch for their stroke`
                : "waiting for the next drawer…"}
            </div>
          )}
        </div>
      </main>

      <footer className="draw-footer">
        {isMyTurn ? (
          <DefaultButton
            label="End my turn"
            onClick={() => server.endTurn(currentGame.roomId)}
          />
        ) : (
          <span className="footer-hint">
            draw when it's your turn · spot the imposter at vote time
          </span>
        )}
      </footer>
    </div>
  );
};

export default GameCanvas;
