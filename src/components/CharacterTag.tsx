import * as React from "react";
import { useSelector } from "react-redux";
import { ReduxState } from "../utils/storage/reducer";

import randomImg from "../assets/img/rolling-dices.svg";

import * as storage from "../utils/storage/storage-container";
import { newCharacterId, newBackGroundColor } from "../utils/defaultCreate";

interface CharacterTagProps {
  style?: {};
  characterStyle?: {};
  withRefresh?: boolean;
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
          }}
          className="characterContainer"
        >
          {props.withRefresh && (
            <img
              src={randomImg}
              alt="Refresh"
              className="refreshCharacter"
              onClick={() =>
                storage.ChangeCharacter(newCharacterId(), newBackGroundColor())
              }
            />
          )}
          <img
            style={{
              ...props.characterStyle,
              maxWidth: "200px",
              maxHeight: "200px",
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
