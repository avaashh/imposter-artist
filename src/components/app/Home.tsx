import * as React from "react";
import * as storage from "../../utils/storage/storage-container";

const HomeScreen = () => {
  return <h1>Home Screen - {storage.ThisPlayer()?.playerName}</h1>;
};

export default HomeScreen;
