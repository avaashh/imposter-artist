import * as React from "react";
import { useSelector } from "react-redux";
import { ReduxState } from "../../utils/storage/reducer";

import "../styles/Lobby.css";

import { SmallCharacterTag } from "../CharacterTag";

import { useNavigate, useParams } from "react-router-dom";
import { SocketContext } from "../../assets/dist/server";
import { Player } from "../../types/User";
import { GameRoomSettings } from "../../types/Room";
import { SmallLogoHeader } from "../Logo";
import { DefaultButton } from "../Buttons";
import DefaultInput, { SelectorInput } from "../Inputs";
import { StoreGameRoom } from "../../utils/storage/storage-container";

import { ToastContainer, toast } from "react-toastify";

interface LobbyPlayerHolderProps {
  currentPlayer?: Player | null;
  playersInLobby?: Player[];
}

interface GameRoomSettingsHolderProps {
  currentPlayer: Player;
  navigate: any;
}

const LobbyPlayerHolder = ({
  currentPlayer,
  playersInLobby,
}: LobbyPlayerHolderProps) => {
  const owner = currentPlayer?.currentRoom?.roomOwner.id;
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
  navigate,
}: GameRoomSettingsHolderProps) => {
  const { server } = React.useContext(SocketContext);

  const room = currentPlayer.currentRoom;
  const isOwner = currentPlayer?.id === room?.roomOwner.id;
  const readOnly = !isOwner;
  const serverSettings = room?.settings;
  const roomId = room?.roomId || "";
  const enoughPlayers = (room?.playersInRoom.length ?? 0) >= 3;

  const [draft, setDraft] = React.useState<GameRoomSettings | undefined>(
    serverSettings
  );

  const serverSettingsKey = JSON.stringify(serverSettings);
  React.useEffect(() => {
    if (serverSettings) setDraft(serverSettings);
  }, [serverSettingsKey]);

  const fullInvite = window.location.href

  const copyInviteCode = (justCode: boolean = false) => {
    navigator.clipboard
      .writeText(justCode ? roomId : fullInvite)
      .then(() =>
        toast("Copied invite to clipboard", {
          position: "top-right",
          autoClose: 3000,
          theme: "light",
        })
      )
      .catch((error) => {
        console.error("Failed to copy text:", error.message);
      });
  };

  const onDraftField = (key: keyof GameRoomSettings) => (v: string) => {
    setDraft((d) => (d ? ({ ...d, [key]: v } as GameRoomSettings) : d));
  };

  const commit = (next: GameRoomSettings) => {
    if (!isOwner || !server || !serverSettings) return;
    if (JSON.stringify(next) === JSON.stringify(serverSettings)) return;
    server.updateSettings(roomId, next);
  };

  const commitNumber = (key: keyof GameRoomSettings) => (v: string) => {
    if (!draft) return;
    const n = parseInt(v, 10);
    if (isNaN(n)) {
      setDraft({ ...draft, [key]: serverSettings?.[key] } as GameRoomSettings);
      return;
    }
    commit({ ...draft, [key]: n } as GameRoomSettings);
  };

  const commitString = (key: keyof GameRoomSettings) => (v: string) => {
    if (!draft) return;
    setDraft({ ...draft, [key]: v } as GameRoomSettings);
    commit({ ...draft, [key]: v } as GameRoomSettings);
  };

  if (!draft || !serverSettings) return <></>;

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
              label="Copy Invite"
              style={{ width: "45%" }}
              onClick={() => copyInviteCode(false)}
            />
            <DefaultButton
              label="Start Game"
              style={{ width: "45%" }}
              disabled={!isOwner || !enoughPlayers}
              onClick={() => server?.startGame(room ?? undefined)}
            />
          </div>
          {!enoughPlayers && (
            <p
              className="midText"
              style={{ textAlign: "center", margin: "8px 0" }}
            >
              Waiting for at least 3 players…
            </p>
          )}
          <div className="row-align">
            <DefaultInput
              label="Max players in room"
              value={`${draft.maxPlayersInRoom}`}
              setValue={onDraftField("maxPlayersInRoom")}
              onCommit={commitNumber("maxPlayersInRoom")}
              readOnly={readOnly}
              type="number"
              width={"45%"}
              required={true}
            />
            <DefaultInput
              label="Max imposters in room"
              value={`${draft.maxImpostersInRoom}`}
              setValue={onDraftField("maxImpostersInRoom")}
              onCommit={commitNumber("maxImpostersInRoom")}
              readOnly={readOnly}
              type="number"
              width={"45%"}
              required={true}
            />
            <DefaultInput
              label="Drawing time for each player (in seconds)"
              value={`${draft.drawingTime}`}
              setValue={onDraftField("drawingTime")}
              onCommit={commitNumber("drawingTime")}
              readOnly={readOnly}
              type="number"
              width={"45%"}
              required={true}
            />
            <DefaultInput
              label="Number of rounds with different imposters"
              value={`${draft.drawingRoundsLimit}`}
              setValue={onDraftField("drawingRoundsLimit")}
              onCommit={commitNumber("drawingRoundsLimit")}
              readOnly={readOnly}
              type="number"
              width={"45%"}
              required={true}
            />
            <SelectorInput
              label="Voting type"
              value={`${draft.votingType}`}
              options={["once", "continued"]}
              onCommit={commitString("votingType")}
              readOnly={readOnly}
              width={"45%"}
              required={true}
            />
            <SelectorInput
              label="Room type"
              value={`${draft.roomType}`}
              options={["private", "public"]}
              onCommit={commitString("roomType")}
              readOnly={readOnly}
              width={"45%"}
              required={true}
            />
            <DefaultButton
              label="Leave Game"
              style={{ width: "95%" }}
              onClick={() => {
                if (roomId) server?.leaveRoom(roomId);
                StoreGameRoom(null);
                navigate("/");
              }}
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

  if (
    currentPlayer?.currentRoom === null ||
    currentPlayer?.currentRoom === undefined
  )
    return <></>;

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
      <GameRoomSettingsHolder
        currentPlayer={currentPlayer}
        navigate={navigate}
      />
    </>
  );
};

export default LobbyScreen;
