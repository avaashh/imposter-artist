import React from "react";

import Timer from "../Timer";
import Canvas from "../Canvas";

import { useWindowDimensions } from "../../utils/windows";
import { ThisPlayer } from "../../utils/storage/storage-container";
import { newRandomKey } from "../../utils/defaultCreate";

import { toast, ToastContainer } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";

import "../styles/GameCanvas.css";
import { Player } from "../../types/User";
import { ColorHex } from "react-countdown-circle-timer";
import { SmallCharacterTag } from "../CharacterTag";
import { SocketContext } from "../../assets/dist/server";
import { Point } from "../../utils/bezierInterpolation";

interface ToolsTabProps {
  timerKey: string;
  isDrawing: boolean;
  drawingEnabled: boolean;
  setDrawingEnabled: (v: boolean) => void;
  allowedDrawingTime: number;
}

const ToolsTab: React.FC<ToolsTabProps> = ({
  timerKey,
  isDrawing,
  drawingEnabled,
  setDrawingEnabled,
  allowedDrawingTime,
}) => {
  return (
    <section style={{ opacity: !drawingEnabled ? 0.25 : 1 }}>
      <Timer
        whatKey={timerKey}
        isPlaying={isDrawing}
        duration={allowedDrawingTime}
        colors={["#000000", "#000000", "#000000"]}
        colorsTime={[allowedDrawingTime, allowedDrawingTime / 2, 0]}
        onComplete={() => setDrawingEnabled(false)}
      />
    </section>
  );
};

interface PlayersTabProps {
  players: Player[];
  playerColors: ColorHex[] | undefined;
}

const PlayersTab: React.FC<PlayersTabProps> = ({ players, playerColors }) => {
  return (
    <section>
      {players.map((player, indx: number) => (
        <div style={{ display: "flex", flexDirection: "row" }}>
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
        </div>
      ))}
    </section>
  );
};

const GameCanvas: React.FC = () => {
  const navigate = useNavigate();
  const { gameID } = useParams();

  const player = ThisPlayer();
  const currentGame = player.currentRoom;

  const { server } = React.useContext(SocketContext);

  React.useEffect(() => {
    if (currentGame === undefined || currentGame === null) {
      navigate(`/?joingame=${gameID}`);
    }
  });

  const { width, height } = useWindowDimensions();

  const [drawingEnabled, setDrawingEnabled] = React.useState<boolean>(true);
  const [isDrawing, setIsDrawing] = React.useState<boolean>(false);
  const [timerKey, setTimerKey] = React.useState<string>(newRandomKey());

  const canvasRef = React.useRef<HTMLDivElement>(null);
  const [size, setSize] = React.useState(0);

  React.useEffect(() => {
    if (canvasRef.current) {
      const windowSize = Math.min(
        canvasRef.current.clientWidth,
        canvasRef.current.clientHeight
      );
      setSize(windowSize * 0.95);
    }
  }, [width, height]);

  React.useEffect(() => {
    if (drawingEnabled)
      toast("Its your turn to draw!", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
  }, [drawingEnabled]);

  const allowDrawing = () => {
    if (drawingEnabled) return;
    setTimerKey(newRandomKey());
    setDrawingEnabled(true);
  };

  const drawingBoardColor = currentGame?.playerColors
    ? currentGame.playerColors[
        currentGame.playersInRoom.map((v) => v.id).indexOf(player.id)
      ]
    : "#000";

  const [addedStroke, setAddedStroke] = React.useState<Array<Point>>([
    { x: 0, y: 0, color: drawingBoardColor },
  ]);

  if (server === null) return <></>;
  if (currentGame === undefined || currentGame === null) return <></>;

  return (
    <div className="fixed-container">
      <ToastContainer />
      <div className="game-container">
        <div className="players-sidebar">
          <h2 onClick={allowDrawing}>Players</h2>
          <PlayersTab
            players={currentGame.playersInRoom}
            playerColors={currentGame.playerColors}
          />
        </div>

        <div className="game-canvas" ref={canvasRef}>
          <Canvas
            player={player}
            size={size}
            drawingEnabled={drawingEnabled}
            drawColor={drawingBoardColor}
            isDrawing={isDrawing}
            setIsDrawing={setIsDrawing}
            setDrawingEnabled={setDrawingEnabled}
            server={server}
            addedStroke={addedStroke}
          />
        </div>
        <div className="tools-sidebar">
          <h2>Tools</h2>
          <ToolsTab
            timerKey={timerKey}
            allowedDrawingTime={currentGame.settings.drawingTime}
            isDrawing={isDrawing}
            drawingEnabled={drawingEnabled}
            setDrawingEnabled={setDrawingEnabled}
          />
        </div>
      </div>
    </div>
  );
};

export default GameCanvas;
