import { Player } from "./User";
import { CanvasPath } from "react-sketch-canvas";
import { Point } from "../utils/bezierInterpolation";

// Interface representing a stroke
export type Stroke = Point[];

// Interface representing a drawn stroke
export interface DrawnStroke {
  owner: Player; // Player who drew the stroke
  stroke: Stroke; // The stroke object
}

// Interface representing a drawing
export interface Drawing {
  strokes: DrawnStroke[]; // Array of drawn strokes
}
