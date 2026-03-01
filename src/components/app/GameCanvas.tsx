import React from "react";
import { useSelector } from "react-redux";

import Timer from "../Timer";
import Canvas from "../Canvas";

import { useWindowDimensions } from "../../utils/windows";
import { newRandomKey } from "../../utils/defaultCreate";

import { toast, ToastContainer } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";

import "../styles/GameCanvas.css";
import { Player } from "../../types/User";
import { ColorHex } from "react-countdown-circle-timer";
import { SmallCharacterTag } from "../CharacterTag";
import { SocketContext } from "../../assets/dist/server";
import { Point } from "../../utils/bezierInterpolation";
import { ReduxState } from "../../utils/storage/reducer";
import { DefaultButton } from "../Buttons";

import VotingScreen from "./VotingScreen";
import GameOverScreen from "./GameOverScreen";

interface PlayersTabProps {
  players: Player[];
  playerColors: ColorHex[] | undefined;
  currentPlayerId?: string;
}

const PlayersTab: React.FC<PlayersTabProps> = ({
  players,
  playerColors,
  currentPlayerId,
}) => {
  return (
    <section>
      {players.map((player, indx: number) => {
        const isDrawer = player.id === currentPlayerId;
        return (
          <div
            key={indx}
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              opacity: isDrawer ? 1 : 0.6,
            }}
          >
            <SmallCharacterTag
              player={player}
              isOwner={player.id === player.currentRoom?.roomOwner.id}
              nextToEachOther={true}
            >
              {playerColors && (
                <span
                  style={{
                    width: 50,
                    height: 10,
                    backgroundColor: playerColors[indx],
                  }}
                ></span>
              )}
            </SmallCharacterTag>
            {isDrawer && <span style={{ marginLeft: 8 }}>←</span>}
          </div>
        );
      })}
    </section>
  );
};

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
  const [timerKey, setTimerKey] = React.useState<string>(newRandomKey());
  const [isDrawing, setIsDrawing] = React.useState<boolean>(false);
  const [addedStroke, setAddedStroke] = React.useState<Array<Point> | null>(
    null
  );
  const [clearSignal, setClearSignal] = React.useState<number>(0);

  React.useEffect(() => {
    if (canvasRef.current) {
      const windowSize = Math.min(
        canvasRef.current.clientWidth,
        canvasRef.current.clientHeight
      );
      setSize(windowSize * 0.95);
    }
  }, [width, height]);

  const isMyTurn =
    !!player && !!turn && turn.currentPlayerId === player.id && phase === "inProgress";

  React.useEffect(() => {
    if (phase !== "inProgress") return;
    setTimerKey(newRandomKey());
    setClearSignal((c) => c + 1);
    if (isMyTurn) {
      toast("Your turn to draw!", {
        position: "top-right",
        autoClose: 2000,
      });
    }
  }, [turn?.currentPlayerId, phase]);

  React.useEffect(() => {
    if (!server) return;
    return server.addMessageHandler((message: any) => {
      if (message.type === "sendStroke" && message.payload?.success) {
        if (message.payload.sentStroke) {
          setAddedStroke(message.payload.sentStroke);
        }
      }
    });
  }, [server]);

  if (!server) return <></>;
  if (!player || !currentGame) return <></>;

  if (phase === "voting") {
    return <VotingScreen />;
  }
  if (phase === "ended") {
    return <GameOverScreen />;
  }

  const playerIdx = currentGame.playersInRoom.map((v) => v.id).indexOf(player.id);
  const drawingBoardColor = currentGame.playerColors
    ? currentGame.playerColors[playerIdx]
    : "#000";

  const currentDrawer = turn
    ? currentGame.playersInRoom.find((p) => p.id === turn.currentPlayerId)
    : undefined;

  const duration = turn?.turnDurationSecs ?? currentGame.settings.drawingTime;
  const wordBanner = role
    ? role.isImposter
      ? "??? (you are the imposter)"
      : role.word
    : "";

  return (
    <div className="fixed-container">
      <ToastContainer />
      <div className="game-container">
        <div className="players-sidebar">
          <h2>Players</h2>
          <PlayersTab
            players={currentGame.playersInRoom}
            playerColors={currentGame.playerColors}
            currentPlayerId={turn?.currentPlayerId}
          />
        </div>

        <div className="game-canvas" ref={canvasRef}>
          <div className="game-hud">
            <span className="hud-word">{wordBanner}</span>
            <span className="hud-turn">
              Round {turn?.round ?? 1} / {turn?.totalRounds ?? currentGame.settings.drawingRoundsLimit}
              {currentDrawer && ` — ${currentDrawer.playerName}'s turn`}
            </span>
          </div>
          <Canvas
            player={player}
            size={size}
            drawingEnabled={isMyTurn}
            drawColor={drawingBoardColor}
            isDrawing={isDrawing}
            setIsDrawing={setIsDrawing}
            setDrawingEnabled={() => {}}
            server={server}
            addedStroke={addedStroke}
            clearSignal={clearSignal}
          />
        </div>
        <div className="tools-sidebar">
          <h2>Timer</h2>
          <Timer
            whatKey={timerKey}
            isPlaying={phase === "inProgress"}
            duration={duration}
            colors={["#000000", "#000000", "#000000"]}
            colorsTime={[duration, duration / 2, 0]}
            onComplete={() => ({ shouldRepeat: false })}
          />
          {isMyTurn && (
            <DefaultButton
              label="End my turn"
              style={{ marginTop: 16, width: "100%" }}
              onClick={() => server.endTurn(currentGame.roomId)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default GameCanvas;
