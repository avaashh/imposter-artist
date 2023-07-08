import React, { useRef, useState, useCallback } from "react";

import "../styles/GameCanvas.css"; // Import CSS module or define styles using a CSS-in-JS solution

import Timer from "../Timer";
import { useParams } from "react-router-dom";
import { ReactSketchCanvas, ReactSketchCanvasRef } from "react-sketch-canvas";

// Defined Types
import { Stroke } from "../../types/Drawing";
// import postStrokeToServer from "../../utils/postStrokeToServer";

interface GameCanvasProps {}

const GameCanvas: React.FC<GameCanvasProps> = () => {
  const { gameID } = useParams();
  console.log("Game ID:", gameID);

  const canvas = useRef<ReactSketchCanvasRef>(null);
  const [canvasEnabled, setCanvasEnabled] = useState(true);
  const [startedDrawing, setStartedDrawing] = useState(false);

  const allowOnlyPointerType = canvasEnabled ? "all" : "none";

  // Handler for the onStroke event of the canvas
  const handleStroke = useCallback(
    (stroke: Stroke) => {
      if (!startedDrawing) {
        // The user has just started drawing - previously not begun
        setStartedDrawing(true);
      } else {
        // The user has just finished drawing - previously begun
        setCanvasEnabled(!canvasEnabled);
        console.log(stroke);
      }
    },
    [canvasEnabled, startedDrawing]
  );

  // Handler for the Timer component's OnComplete event
  const handleTimerComplete = useCallback(() => {
    // Time is up for drawing
    setCanvasEnabled((prevEnabled) => !prevEnabled);
    if (canvas.current) {
      // Make sure canvas is not null
      canvas.current
        .exportPaths()
        // The last path has been created most recently on the canvas
        .then((paths) => paths[paths.length - 1])
        .then((stroke: Stroke) => {
          // postStrokeToServer( , stroke);
        });
    }
  }, [canvas]);

  return (
    <div className={"container"}>
      {/* Canvas */}
      <ReactSketchCanvas
        ref={canvas}
        height={"400"}
        strokeWidth={5}
        className={"canvas"}
        strokeColor="black"
        onStroke={handleStroke}
        allowOnlyPointerType={allowOnlyPointerType}
      />

      {/* Timer component */}
      <Timer
        isPlaying={startedDrawing && canvasEnabled}
        duration={2}
        colors={["#27AE60", "#D4AC0D", "#DC7633", "#C0392B"]}
        colorsTime={[0.75, 0.5, 0.25, 0]}
        OnComplete={handleTimerComplete}
      />
    </div>
  );
};

export default GameCanvas;
