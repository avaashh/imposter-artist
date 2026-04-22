import * as React from "react";

import { Stage, Layer, Line } from "react-konva";
import { ColorHex } from "react-countdown-circle-timer";

import smoothPoints, { Point } from "../utils/bezierInterpolation";
import { Player } from "../types/User";
import Server from "../assets/dist/server";

interface CanvasProps {
  player: Player;
  size: number;
  drawColor: ColorHex;
  drawingEnabled: boolean;
  server: Server;
  // Every completed stroke in the current game, in temporal order —
  // including the drawer's own strokes. GameCanvas owns this list so that
  // render ordering is consistent for everyone: newer strokes always paint
  // on top.
  strokes: Point[][];
  // Live preview of another player's in-progress stroke. Viewers receive
  // delta batches over the wire and GameCanvas accumulates them here so we
  // can render the stroke as it's being drawn.
  remoteInProgress: Point[] | null;
  onLocalStroke: (stroke: Point[]) => void;
}

// How often the drawer streams in-progress deltas to the server. ~25 Hz
// feels live without flooding the socket with every mousemove event.
const PROGRESS_THROTTLE_MS = 40;

const Canvas: React.FC<CanvasProps> = ({
  player,
  size,
  drawColor,
  drawingEnabled,
  server,
  strokes,
  remoteInProgress,
  onLocalStroke,
}) => {
  const pointNormalizer: number = 100 / size;

  // The stroke the drawer is currently building, rendered locally until the
  // pen lifts. On mouse-up we commit it to the shared list and send it.
  const [current, setCurrent] = React.useState<Point[] | null>(null);
  const isDrawingRef = React.useRef(false);
  // Mirrors `current` synchronously so the throttled sender can compute the
  // delta without waiting for the next React render.
  const currentRef = React.useRef<Point[] | null>(null);
  // Index in `currentRef.current` up to which we've already streamed points.
  const lastSentIdxRef = React.useRef(0);
  const lastSentAtRef = React.useRef(0);

  const flushProgress = React.useCallback(
    (force: boolean) => {
      const stroke = currentRef.current;
      if (!stroke) return;
      const now = Date.now();
      if (!force && now - lastSentAtRef.current < PROGRESS_THROTTLE_MS) return;
      const startIdx = lastSentIdxRef.current;
      if (stroke.length <= startIdx) return;
      const delta = stroke.slice(startIdx);
      const isStart = startIdx === 0;
      server.postStrokeProgressToServer(player, delta, isStart);
      lastSentIdxRef.current = stroke.length;
      lastSentAtRef.current = now;
    },
    [server, player]
  );

  const handleMouseDown = (e: any) => {
    if (!drawingEnabled) return;
    const pos = e.target.getStage().getPointerPosition();
    if (!pos) return;
    isDrawingRef.current = true;
    const first: Point = {
      x: pos.x * pointNormalizer,
      y: pos.y * pointNormalizer,
      color: drawColor,
    };
    currentRef.current = [first];
    lastSentIdxRef.current = 0;
    lastSentAtRef.current = 0;
    setCurrent([first]);
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawingRef.current || !drawingEnabled) return;
    const pos = e.target.getStage().getPointerPosition();
    if (!pos) return;
    const next: Point = {
      x: pos.x * pointNormalizer,
      y: pos.y * pointNormalizer,
      color: drawColor,
    };
    const updated = currentRef.current ? [...currentRef.current, next] : [next];
    currentRef.current = updated;
    setCurrent(updated);
    flushProgress(false);
  };

  const handleMouseUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const stroke = currentRef.current;
    currentRef.current = null;
    lastSentIdxRef.current = 0;
    lastSentAtRef.current = 0;
    setCurrent(null);
    if (stroke && stroke.length >= 2) {
      onLocalStroke(stroke);
      server.postStrokeToServer(player, stroke);
    }
  };

  return (
    <Stage
      width={size}
      height={size}
      onMouseDown={handleMouseDown}
      onMousemove={handleMouseMove}
      onMouseup={handleMouseUp}
      onMouseleave={handleMouseUp}
      onTouchstart={handleMouseDown}
      onTouchmove={handleMouseMove}
      onTouchend={handleMouseUp}
      style={{
        backgroundColor: "#ffffff",
        cursor: drawingEnabled ? "crosshair" : "not-allowed",
        borderRadius: 6,
        touchAction: "none",
      }}
    >
      <Layer>
        {strokes.map((line, i) => (
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
        {current && current.length > 0 && (
          <Line
            points={smoothPoints(current, current[0].color).flatMap((point) => [
              point.x / pointNormalizer,
              point.y / pointNormalizer,
            ])}
            stroke={current[0].color}
            strokeWidth={5}
            lineCap="round"
            lineJoin="round"
          />
        )}
        {remoteInProgress && remoteInProgress.length > 0 && (
          <Line
            points={smoothPoints(remoteInProgress, remoteInProgress[0].color).flatMap(
              (point) => [point.x / pointNormalizer, point.y / pointNormalizer]
            )}
            stroke={remoteInProgress[0].color}
            strokeWidth={5}
            lineCap="round"
            lineJoin="round"
          />
        )}
      </Layer>
    </Stage>
  );
};

export default Canvas;
