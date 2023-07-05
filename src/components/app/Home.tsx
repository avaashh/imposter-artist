import * as React from "react";
import { Link } from "react-router-dom";

import * as storage from "../../utils/storage/storage-container";

const HomeScreen = () => {
  return (
    <div>
      <h1>Home Screen - {storage.ThisPlayer()?.playerName}</h1>
      <Link to="/play/MEM">Play</Link>
      <div>{"\n\n"}</div>
      <Link to="/lobby/MEM">Lobby</Link>
    </div>
  );
};

export default HomeScreen;
