import * as React from "react";

import { Stage, Layer, Line } from "react-konva";
import { ColorHex } from "react-countdown-circle-timer";

import smoothPoints, { Point } from "../utils/bezierInterpolation";
import { Player } from "../types/User";
import Server from "../assets/dist/server";
import { Stroke } from "../types/Drawing";

interface CanvasProps {
  player: Player;
  size: number;
  isDrawing: boolean;
  drawColor: ColorHex;
  setIsDrawing: (v: boolean) => void;
  drawingEnabled: boolean;
  setDrawingEnabled: (v: boolean) => void;
  server: Server;
  addedStroke: Stroke | null;
  clearSignal?: number;
}

const Canvas: React.FC<CanvasProps> = ({
  player,
  size,
  isDrawing,
  drawColor,
  setIsDrawing,
  drawingEnabled,
  setDrawingEnabled,
  server,
  addedStroke,
  clearSignal,
}) => {
  const pointNormalizer: number = 100 / size;

  const [lines, setLines] = React.useState<Point[][]>([]);
  const prevPos = React.useRef<Point | null>(null);
  const pendingSend = React.useRef<boolean>(false);

  const handleMouseDown = (e: any) => {
    if (!drawingEnabled) return;

    setIsDrawing(true);
    const pos = e.target.getStage().getPointerPosition();
    if (pos) {
      setLines((prev) => [
        ...prev,
        [
          {
            x: pos.x * pointNormalizer,
            y: pos.y * pointNormalizer,
            color: drawColor,
          },
        ],
      ]);
    }
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing || !drawingEnabled) return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    if (!point) return;
    const { x, y } = point;
    const x_pos = x * pointNormalizer;
    const y_pos = y * pointNormalizer;

    if (prevPos.current) {
      setLines((prev) => {
        if (prev.length === 0) return prev;
        const updated = prev.slice(0, -1);
        const last = [...prev[prev.length - 1]];
        last.push({ x: x_pos, y: y_pos, color: drawColor });
        return [...updated, last];
      });
    }
    prevPos.current = { x: x_pos, y: y_pos, color: drawColor };
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setDrawingEnabled(false);
    prevPos.current = null;
    pendingSend.current = true;
  };

  // When a stroke settles into `lines`, send it once.
  React.useEffect(() => {
    if (!pendingSend.current) return;
    if (lines.length === 0) return;
    const lastLine = lines[lines.length - 1];
    if (lastLine.length < 2) {
      pendingSend.current = false;
      return;
    }
    server.postStrokeToServer(player, lastLine);
    pendingSend.current = false;
  }, [lines, server, player]);

  // Accept strokes from other players.
  React.useEffect(() => {
    if (!addedStroke || addedStroke.length === 0) return;
    setLines((prev) => [...prev, addedStroke]);
  }, [addedStroke]);

  // Clear the canvas when a new round/turn says so.
  React.useEffect(() => {
    if (clearSignal === undefined) return;
    setLines([]);
  }, [clearSignal]);

  return (
    <Stage
      width={size}
      height={size}
      onMouseDown={handleMouseDown}
      onMousemove={handleMouseMove}
      onMouseup={handleMouseUp}
      onTouchstart={handleMouseDown}
      onTouchmove={handleMouseMove}
      onTouchend={handleMouseUp}
      style={{
        backgroundColor: "#fff",
        cursor: drawingEnabled ? "crosshair" : "not-allowed",
        borderRadius: 12,
      }}
    >
      <Layer>
        {lines.map((line, i) => (
          <Line
            key={i}
            points={smoothPoints(line, line[0].color).flatMap((point) => [
              point.x / pointNormalizer,
              point.y / pointNormalizer,
            ])}
            stroke={line[0].color}
            strokeWidth={5}
            lineCap="round"
            lineJoin="round"
          />
        ))}
      </Layer>
    </Stage>
  );
};

export default Canvas;
