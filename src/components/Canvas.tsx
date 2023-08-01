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
  addedStroke: Stroke;
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
}) => {
  const pointNormalizer: number = 100 / size;

  const [update, setUpdate] = React.useState<number>(0);
  const [lines, setLines] = React.useState<Point[][]>([]);
  const prevPos = React.useRef<Point | null>(null);

  const handleMouseDown = (e: any) => {
    if (!drawingEnabled) return;

    setIsDrawing(true);
    const pos = e.target.getStage().getPointerPosition();
    if (pos) {
      setLines([
        ...lines,
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
    if (point) {
      const { x, y } = point;
      if (prevPos.current) {
        const newLine = [...lines[lines.length - 1]];

        const x_pos = x * pointNormalizer;
        const y_pos = y * pointNormalizer;

        newLine.push({ x: x_pos, y: y_pos, color: drawColor });

        const newLines = [...lines];
        newLines[lines.length - 1] = newLine;
        setLines(newLines);
      }
      prevPos.current = {
        x: x * pointNormalizer,
        y: y * pointNormalizer,
        color: drawColor,
      };
    }
  };

  const handleMouseUp = () => {
    setDrawingEnabled(false);
    setIsDrawing(false);
    prevPos.current = null;
    setUpdate(update + 1);
  };

  React.useEffect(() => {
    if (update !== 0)
      server.postStrokeToServer(player, lines[lines.length - 1]);
  }, [update]);

  React.useEffect(() => {
    let currLines = [...lines];
    setLines(currLines.concat([addedStroke]));
  }, [addedStroke]);

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
        position: "fixed",
        backgroundColor: "#fff",
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
