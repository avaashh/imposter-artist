import * as React from "react";
import { useSelector } from "react-redux";
import { ReduxState } from "../utils/storage/reducer";

import randomImg from "../assets/img/rolling-dices.svg";
import verified from "../assets/img/verified.svg";

import * as storage from "../utils/storage/storage-container";
import { newCharacterId, newBackGroundColor } from "../utils/defaultCreate";
import { Player } from "../types/User";

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

interface SmallCharacterTagProps {
  player: Player;
  isOwner?: boolean;
}

export const SmallCharacterTag = ({
  player,
  isOwner,
}: SmallCharacterTagProps) => {
  return (
    <section style={{ padding: 5 }}>
      <div
        style={{
          width: "75px",
          height: "75px",
          backgroundColor: player.character?.characterColor,
        }}
        className="characterContainer"
      >
        <img
          style={{
            width: "70px",
            height: "70px",
            // maxWidth: "200px",
            // maxHeight: "200px",
            objectFit: "contain",
          }}
          src={require(`../assets/characters/${player.character?.characterIdentity}.svg`)}
          alt="Character Tag"
        />
      </div>
      <p
        style={{
          width: "75px",
          textAlign: "center",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 1,
          fontWeight: 500,
          fontSize: 14,
          flexWrap: "wrap",
        }}
      >
        {player.playerName}
        {isOwner && (
          <img
            src={verified}
            alt="Room Owner"
            width={12}
            height={12}
            style={{ paddingLeft: 2 }}
          />
        )}
      </p>
    </section>
  );
};

export default CharacterTag;
