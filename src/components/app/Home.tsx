import * as React from "react";

import background from "../../assets/img/background.svg";
import "../styles/Home.css";

import { DefaultButton } from "../Buttons";

import { ChangeablePlayerTag } from "../PlayerTag";
import CharacterTag from "../CharacterTag";
import { SocketContext } from "../../assets/dist/server";
import { defaultGameRoom, newRoomId } from "../../utils/defaultCreate";

import { ThisPlayer } from "../../utils/storage/storage-container";
import Popup from "../Windows";
import DefaultInput from "../Inputs";

import { ToastContainer } from "react-toastify";
import { LargeLogoHeader } from "../Logo";

const PromptPlayer = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const joinGameValue = urlParams.get("joingame");

  const { server } = React.useContext(SocketContext);

  const [isVisible, setIsVisible] = React.useState(false);
  const [roomCode, setRoomCode] = React.useState("");

  return (
    <div className="promptParent">
      <div className="promptContainer">
        <ChangeablePlayerTag />
        <CharacterTag withRefresh={true} />
        <div style={{ display: "flex", flexDirection: "row" }}>
          <DefaultButton
            label={"Create a game"}
            style={{ margin: "5px" }}
            onClick={() =>
              server?.createGameRoom(defaultGameRoom(newRoomId(), ThisPlayer()))
            }
          />
          <DefaultButton
            label={"Join" + (joinGameValue === null ? " a" : "") + " room"}
            style={{ margin: "5px" }}
            onClick={() =>
              joinGameValue === null
                ? setIsVisible(true)
                : server?.joinRoomWithCode(joinGameValue, ThisPlayer())
            }
          />
        </div>
      </div>

      <Popup isVisible={isVisible} setIsVisible={setIsVisible}>
        <h3 className="largeText centeredText">Join a Room</h3>
        <div className="joinRoomAction">
          <div>
            <p className="midText leftText">Have a room code?</p>
            <DefaultInput
              label="Enter it here:"
              value={roomCode}
              setValue={setRoomCode}
            />
            <DefaultButton
              label="Join Room"
              disabled={roomCode.length === 0}
              style={{ width: "100%" }}
              onClick={() => server?.joinRoomWithCode(roomCode, ThisPlayer())}
            />
            <DefaultButton
              label="Join a Random Room"
              style={{ width: "100%" }}
            />
          </div>
        </div>
      </Popup>
    </div>
  );
};

const HowToPlayPopup: React.FC<{
  isVisible: boolean;
  setIsVisible: (v: boolean) => void;
}> = ({ isVisible, setIsVisible }) => (
  <Popup isVisible={isVisible} setIsVisible={setIsVisible}>
    <h3 className="largeText centeredText">How to Play</h3>
    <div style={{ maxWidth: 480 }}>
      <ol className="midText" style={{ lineHeight: 1.5, paddingLeft: 18 }}>
        <li>Create a room and share the invite with 2+ friends.</li>
        <li>
          Everyone gets a secret word — except one player, the
          <strong> imposter</strong>, who only knows it's their turn to blend
          in.
        </li>
        <li>
          Take turns adding <strong>one stroke each</strong> to the same
          drawing.
        </li>
        <li>
          After every round, vote on who you think is the imposter. Tie votes
          mean the imposter escapes.
        </li>
        <li>
          Catch the imposter and the artists split a point. The imposter gets
          two for a successful sneak.
        </li>
      </ol>
      <p
        className="midText"
        style={{ textAlign: "center", marginTop: 16, opacity: 0.7 }}
      >
        Trust no one. Draw carefully.
      </p>
    </div>
  </Popup>
);

const HomeScreen = () => {
  const [howToVisible, setHowToVisible] = React.useState(false);
  return (
    <div
      className="appBackground"
      style={{
        backgroundImage: `url(${background})`,
        backgroundPosition: "center",
        backgroundSize: "contain",
      }}
    >
      <ToastContainer />
      <section>
        <LargeLogoHeader />
      </section>

      <section>
        <PromptPlayer />
      </section>

      <section className="centered-component">
        <div className="bottom-container">
          <button
            className="link-button"
            onClick={() => setHowToVisible(true)}
          >
            How to Play
          </button>
          <a
            className="link-button"
            href="https://github.com/avaashh/imposter-artist"
            target="_blank"
            rel="noreferrer"
          >
            Source on GitHub
          </a>
        </div>
      </section>

      <HowToPlayPopup
        isVisible={howToVisible}
        setIsVisible={setHowToVisible}
      />
    </div>
  );
};

export default HomeScreen;
