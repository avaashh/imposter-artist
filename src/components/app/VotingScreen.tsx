import * as React from "react";
import { useSelector } from "react-redux";

import { SocketContext } from "../../assets/dist/server";
import { ReduxState } from "../../utils/storage/reducer";
import { Player } from "../../types/User";

import { DefaultButton } from "../Buttons";
import { SmallCharacterTag } from "../CharacterTag";
import { SmallLogoHeader } from "../Logo";

const VotingScreen: React.FC = () => {
  const player = useSelector((s: ReduxState) => s.player);
  const voting = useSelector((s: ReduxState) => s.voting);
  const { server } = React.useContext(SocketContext);

  const [submittedFor, setSubmittedFor] = React.useState<string | null>(null);

  const room = player?.currentRoom;
  if (!player || !room) return <></>;

  const roomId = room.roomId;
  const players = room.playersInRoom;

  const hasVoted =
    submittedFor !== null ||
    (voting?.votedPlayerIds ?? []).includes(player.id);

  const vote = (target: Player) => {
    if (hasVoted) return;
    setSubmittedFor(target.id);
    server?.sendVote(roomId, target.id);
  };

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
          paddingTop: "15vh",
          gap: 16,
        }}
      >
        <h1 className="largeText boldText" style={{ textAlign: "center" }}>
          Who's the imposter?
        </h1>
        <p className="midText" style={{ textAlign: "center", maxWidth: 420 }}>
          {hasVoted
            ? "Vote locked in. Waiting for everyone else."
            : "Tap the player you think drew without knowing the word."}
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            maxWidth: 640,
            width: "90%",
          }}
        >
          {players.map((p) => {
            const alreadyVoted = (voting?.votedPlayerIds ?? []).includes(p.id);
            const isSelf = p.id === player.id;
            return (
              <div
                key={p.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  padding: 12,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  opacity: isSelf ? 0.5 : 1,
                }}
              >
                <SmallCharacterTag
                  player={p}
                  isOwner={p.id === room.roomOwner.id}
                />
                <small>{alreadyVoted ? "voted" : "thinking..."}</small>
                <DefaultButton
                  label={isSelf ? "(you)" : "Accuse"}
                  onClick={() => vote(p)}
                  disabled={hasVoted || isSelf}
                  style={{ width: "100%" }}
                />
              </div>
            );
          })}
        </div>

        {voting && (
          <p className="midText">
            {voting.totalVotes} / {voting.totalPlayers} voted
          </p>
        )}
      </section>
    </>
  );
};

export default VotingScreen;
