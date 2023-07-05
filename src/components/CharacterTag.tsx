import * as React from "react";
import { useSelector } from "react-redux";
import { ReduxState } from "../utils/storage/reducer";

interface CharacterTagProps {
  style?: {};
  characterStyle?: {};
}

const CharacterTag = (props: CharacterTagProps) => {
  const characterData = useSelector(
    (state: ReduxState) => state.player?.character
  );

  return (
    <>
      {characterData !== undefined && characterData !== null && (
        <div
          style={{
            ...props.style,
            backgroundColor: characterData?.characterColor,
            maxWidth: "250px",
            maxHeight: "250px",
          }}
        >
          <img
            style={{
              ...props.characterStyle,
              maxWidth: "250px",
              maxHeight: "250px",
              objectFit: "contain",
            }}
            src={require(`../assets/characters/${characterData?.characterIdentity}.svg`)}
            alt="Character Tag"
          />
        </div>
      )}
    </>
  );
};

export default CharacterTag;
