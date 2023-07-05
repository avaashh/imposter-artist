import * as React from "react";
import { useSelector } from "react-redux";
import { ReduxState } from "../utils/storage/reducer";

interface PlayerTagProps {
  style?: {};
}

const PlayerTag = (props: PlayerTagProps) => {
  const playerData = useSelector((state: ReduxState) => state.player);
  return (
    <h1 style={{ ...props.style, fontFamily: "Poppins" }}>
      {playerData?.playerName}
    </h1>
  );
};

export default PlayerTag;
