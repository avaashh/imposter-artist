import { ColorHex } from "react-countdown-circle-timer";

export interface Point {
  x: number;
  y: number;
  color: ColorHex;
}

// Cubic Bézier interpolation
const smoothPoints = (points: Point[], color: ColorHex): Point[] => {
  const numControlPoints = 0;
  const bezierPoints: Point[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];

    bezierPoints.push(p1);

    for (let j = 1; j <= numControlPoints; j++) {
      const t = j / numControlPoints;
      const c1 = {
        x: p1.x + (p2.x - p1.x) * t,
        y: p1.y + (p2.y - p1.y) * t,
        color: color,
      };
      bezierPoints.push(c1);
    }

    bezierPoints.push(p2);
  }

  return bezierPoints;
};

export default smoothPoints;
