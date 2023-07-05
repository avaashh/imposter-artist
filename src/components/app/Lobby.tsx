import * as React from "react";
import * as storage from "../../utils/storage/storage-container";

import PlayerTag from "../PlayerTag";
import CharacterTag from "../CharacterTag";

import {
  newPlayerId,
  newPlayerName,
  newCharacterId,
  newBackGroundColor,
} from "../../utils/defaultCreate";

const LobbyScreen = () => {
  return (
    <div>
      <h1>Lobby Screen</h1>
      <PlayerTag />
      <CharacterTag />

      <button
        onClick={() => {
          storage.StorePlayer(newPlayerId(), newPlayerName());
          storage.ChangeCharacter(newCharacterId(), newBackGroundColor());
        }}
      >
        Update User
      </button>
    </div>
  );
};

export default LobbyScreen;
