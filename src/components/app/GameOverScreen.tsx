import * as React from "react";
import { useSelector } from "react-redux";

import { SocketContext } from "../../assets/dist/server";
import { ReduxState } from "../../utils/storage/reducer";

import { DefaultButton } from "../Buttons";
import { SmallCharacterTag } from "../CharacterTag";
import { SmallLogoHeader } from "../Logo";

const GameOverScreen: React.FC = () => {
  const player = useSelector((s: ReduxState) => s.player);
  const result = useSelector((s: ReduxState) => s.result);
  const { server } = React.useContext(SocketContext);

  const room = player?.currentRoom;
  if (!player || !room) return <></>;

  const isOwner = player.id === room.roomOwner.id;
  const imposter = room.playersInRoom.find(
    (p) => p.id === result?.imposterPlayerId
  );

  const scores = room.scores ?? {};
  const rankedPlayers = [...room.playersInRoom].sort(
    (a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0)
  );

  return (
    <>
      <div style={{ position: "absolute", top: 0, left: 0 }}>
        <SmallLogoHeader />
      </div>
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: "10vh",
          gap: 20,
        }}
      >
        <h1 className="largeText boldText" style={{ textAlign: "center" }}>
          {result?.imposterWon ? "The imposter escaped!" : "Imposter caught!"}
        </h1>

        {result && (
          <p className="midText" style={{ textAlign: "center", maxWidth: 420 }}>
            The word was <strong>{result.secretWord}</strong>.
            {imposter && (
              <>
                {" "}The imposter was <strong>{imposter.playerName}</strong>.
              </>
            )}
          </p>
        )}

        <section>
          <h2
            className="midText boldText long-dash"
            style={{ textAlign: "center", lineHeight: 0, marginBottom: 20 }}
          >
            Scores
          </h2>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              minWidth: 240,
            }}
          >
            {rankedPlayers.map((p) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px dashed #ddd",
                  paddingBottom: 4,
                }}
              >
                <SmallCharacterTag
                  player={p}
                  isOwner={p.id === room.roomOwner.id}
                  nextToEachOther={true}
                />
                <span className="midText boldText">{scores[p.id] ?? 0}</span>
              </div>
            ))}
          </div>
        </section>

        {isOwner ? (
          <DefaultButton
            label="Play again"
            style={{ width: 240 }}
            onClick={() => server?.playAgain(room.roomId)}
          />
        ) : (
          <p className="midText">Waiting for the host to start a new round…</p>
        )}
      </section>
    </>
  );
};

export default GameOverScreen;
