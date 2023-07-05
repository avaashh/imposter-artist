import * as React from "react";

import PlayerTag from "../PlayerTag";
import CharacterTag from "../CharacterTag";

const LobbyScreen = () => {
  return (
    <div>
      <h1>Lobby Screen</h1>
      <PlayerTag />
      <CharacterTag />
    </div>
  );
};

export default LobbyScreen;
