import * as React from "react";
import { useSelector } from "react-redux";
import { ReduxState } from "../../utils/storage/reducer";

import "../styles/Lobby.css";

import { SmallCharacterTag } from "../CharacterTag";

import { useNavigate, useParams } from "react-router-dom";
import { SocketContext } from "../../assets/dist/server";
import { Player } from "../../types/User";
import { StoreGameRoom } from "../../utils/storage/storage-container";
import { SmallLogoHeader } from "../Logo";
import { DefaultButton } from "../Buttons";
import DefaultInput, { SelectorInput } from "../Inputs";

import { ToastContainer, toast } from "react-toastify";

interface LobbyPlayerHolderProps {
  currentPlayer?: Player | null;
  playersInLobby?: Player[];
}
interface GameRoomSettingsHolderProps {
  currentPlayer: Player | null | undefined;
}

const LobbyPlayerHolder = ({
  currentPlayer,
  playersInLobby,
}: LobbyPlayerHolderProps) => {
  const { server } = React.useContext(SocketContext);

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
  const owner = currentPlayer?.currentRoom?.roomOwner.id;
  React.useEffect(() => server?.addMessageHandler(eventHandler));
  return (
    <section style={{ display: "flex", justifyContent: "center" }}>
      <div className="player-holder-container">
        <h1
          className="midText boldText long-dash"
          style={{ textAlign: "center", lineHeight: 0, marginBottom: 15 }}
        >
          Players
        </h1>
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
    </section>
  );
};

const GameRoomSettingsHolder = ({
  currentPlayer,
}: GameRoomSettingsHolderProps) => {
  const isOwner =
    currentPlayer?.id !== currentPlayer?.currentRoom?.roomOwner.id;
  return (
    <section>
      <div
        style={{ display: "flex", justifyContent: "center", paddingTop: 25 }}
      >
        <section className="player-holder-container">
          <h1
            className="midText boldText long-dash"
            style={{ textAlign: "center", lineHeight: 0, marginBottom: 15 }}
          >
            Settings
          </h1>
          <div className="row-align">
            <DefaultButton
              label="Copy Invite Code"
              style={{ width: "45%" }}
              onClick={() =>
                navigator.clipboard
                  .writeText(
                    `Hey hey,
Let's play a game of Imposter Artist online! Click on the link to join my room:
${window.location.href}`
                  )
                  .then(() =>
                    toast("Copied invite to clipboard", {
                      position: "top-right",
                      autoClose: 5000,
                      hideProgressBar: false,
                      closeOnClick: true,
                      pauseOnHover: true,
                      draggable: true,
                      progress: undefined,
                      theme: "light",
                    })
                  )
                  .catch((error) => {
                    console.error("Failed to copy text:", error.message);
                  })
              }
            />
            <DefaultButton
              label="Start Game"
              style={{ width: "45%" }}
              disabled={isOwner}
            />
          </div>
          <div className="row-align">
            <DefaultInput
              label="Max players in room"
              value="8"
              width={"45%"}
              required={true}
            />
            <DefaultInput
              label="Max imposters in room"
              value="1"
              width={"45%"}
              required={true}
            />
            <DefaultInput
              label="Drawing time for each player (in seconds)"
              value="2"
              width={"45%"}
              required={true}
            />
            <DefaultInput
              label="Number of rounds with different imposters"
              value="5"
              width={"45%"}
              required={true}
            />
            <SelectorInput
              label="Voting type"
              value="Once"
              options={["Once", "Continued"]}
              width={"45%"}
              required={true}
            />
            <SelectorInput
              label="Room type"
              value="Private"
              options={["Private", "Public"]}
              width={"45%"}
              required={true}
            />
          </div>
        </section>
      </div>
    </section>
  );
};

const LobbyScreen = () => {
  const navigate = useNavigate();
  const { gameID } = useParams();
  const currentPlayer = useSelector((state: ReduxState) => state.player);
  const playersInLobby = currentPlayer?.currentRoom?.playersInRoom;

  React.useEffect(() => {
    if (
      currentPlayer?.currentRoom === null ||
      currentPlayer?.currentRoom === undefined
    ) {
      navigate(`/?joingame=${gameID}`);
    }
  });

  return (
    <>
      <ToastContainer />
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "20vh",
        }}
      >
        <div style={{ position: "absolute", top: "0px", left: "0px" }}>
          <SmallLogoHeader />
        </div>
        <h1
          className="largeText boldText"
          style={{ textAlign: "center", maxWidth: "100px" }}
        >
          Lobby
        </h1>
      </section>

      <LobbyPlayerHolder
        currentPlayer={currentPlayer}
        playersInLobby={playersInLobby}
      />
      <GameRoomSettingsHolder currentPlayer={currentPlayer} />
    </>
  );
};

export default LobbyScreen;
