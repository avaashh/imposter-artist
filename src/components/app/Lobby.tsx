import * as React from "react";
import { useSelector } from "react-redux";
import { ReduxState } from "../../utils/storage/reducer";

import "../styles/Lobby.css";

import { SmallCharacterTag } from "../CharacterTag";

import { useNavigate, useParams } from "react-router-dom";
import { SocketContext } from "../../assets/dist/server";
import { Player } from "../../types/User";
import { StoreGameRoom } from "../../utils/storage/storage-container";

const LobbyScreen = () => {
  const { gameID } = useParams();
  const navigate = useNavigate();

  const { server } = React.useContext(SocketContext);
  const currentPlayer = useSelector((state: ReduxState) => state.player);

  const playersInLobby = currentPlayer?.currentRoom?.playersInRoom;

  const eventHandler = (message: any) => {
    if (message.type === "playerJoinedGame") {
      let rnPlayers = [];
      if (playersInLobby !== undefined)
        playersInLobby?.forEach((player) => rnPlayers.push(player));
      rnPlayers.push(message.payload.player);

      if (
        currentPlayer !== undefined &&
        currentPlayer !== null &&
        currentPlayer.currentRoom !== undefined &&
        currentPlayer.currentRoom !== null
      ) {
        currentPlayer.currentRoom.playersInRoom = rnPlayers;
        StoreGameRoom(currentPlayer.currentRoom);
      }
    }
  };

  React.useEffect(() => server?.addMessageHandler(eventHandler));
  React.useEffect(() => {
    if (
      currentPlayer?.currentRoom === null ||
      currentPlayer?.currentRoom === undefined
    ) {
      navigate(`/?joingame=${gameID}`);
    }
  });

  const owner = currentPlayer?.currentRoom?.roomOwner.id;
  return (
    <div>
      <h1 className="largeText centeredText boldText">Lobby</h1>

      <div className="player-holder">
        {playersInLobby?.map(
          (player: Player | null | undefined, indx: number) => {
            return player !== null && player !== undefined ? (
              <SmallCharacterTag
                key={indx}
                player={player}
                isOwner={player.id === owner}
              />
            ) : (
              <></>
            );
          }
        )}
      </div>
    </div>
  );
};

export default LobbyScreen;
