import React, { useRef, useState } from "react";
import { CountdownCircleTimer, ColorHex } from "react-countdown-circle-timer";

import "./styles/Timer.css";

// renderTime - helper function to render time inside TimerLoop
const RenderTime = ({ remainingTime }: any) => {
  const currentTime = useRef(remainingTime);
  const prevTime = useRef(null);
  const isNewTimeFirstTick = useRef(false);
  const [, setOneLastRerender] = useState(0);

  if (currentTime.current !== remainingTime) {
    isNewTimeFirstTick.current = true;
    prevTime.current = currentTime.current;
    currentTime.current = remainingTime;
  } else {
    isNewTimeFirstTick.current = false;
  }

  // force one last re-render when the time is over to trigger the last animation
  if (remainingTime === 0) {
    setTimeout(() => {
      setOneLastRerender((val) => val + 1);
    }, 20);
  }

  const isTimeUp = isNewTimeFirstTick.current;

  return (
    <div className="time-wrapper">
      <div key={remainingTime} className={`time ${isTimeUp ? "up" : ""}`}>
        {remainingTime}
      </div>
      {prevTime.current !== null && (
        <div
          key={prevTime.current}
          className={`time ${!isTimeUp ? "down" : ""}`}
        >
          {prevTime.current}
        </div>
      )}
    </div>
  );
};

interface TimerProps {
  isPlaying: boolean;
  duration: number;
  colors: { 0: ColorHex } & { 1: ColorHex } & ColorHex[];
  colorsTime: { 0: number } & { 1: number } & number[];
  OnComplete?: (totalElapsedTime: number) => void;
}

const Timer: React.FC<TimerProps> = (props) => {
  const { isPlaying, duration, colors, colorsTime, OnComplete } = props;

  return (
    <CountdownCircleTimer
      isPlaying={isPlaying}
      duration={duration}
      colors={colors}
      colorsTime={colorsTime}
      onComplete={OnComplete}
    >
      {RenderTime}
    </CountdownCircleTimer>
  );
};

export default Timer;
