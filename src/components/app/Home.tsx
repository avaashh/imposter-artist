import * as React from "react";
import { Link } from "react-router-dom";

import background from "../../assets/img/background.svg";
import logo from "../../assets/img/logo.svg";
import "../styles/Home.css";

import { DefaultButton } from "../Buttons";

import { ChangeablePlayerTag } from "../PlayerTag";
import CharacterTag from "../CharacterTag";
import { SocketContext } from "../../assets/dist/server";
import { defaultGameRoom, newRoomId } from "../../utils/defaultCreate";

import { ThisPlayer } from "../../utils/storage/storage-container";
import Popup from "../Windows";
import DefaultInput from "../Inputs";

const PromptPlayer = () => {
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
              server !== null &&
              server.createGameRoom(
                defaultGameRoom(newRoomId(), ThisPlayer(), [])
              )
            }
          />
          <DefaultButton
            label={"Join a room"}
            style={{ margin: "5px" }}
            onClick={() => setIsVisible(true)}
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

const HomeScreen = () => {
  return (
    <div
      className="appBackground"
      style={{
        backgroundImage: `url(${background})`,
        backgroundPosition: "center",
        backgroundSize: "contain",
      }}
    >
      <section>
        <Link to="/" style={{ textDecoration: "none", color: "black" }}>
          <div className="headerComponent">
            <img src={logo} className="appLogo" alt="Logo" />
            <div className="headerSalutation">
              <h5 className="headerWelcome">Welcome to</h5>
              <h1 className="headerImposter">Imposter Artist!</h1>
            </div>
          </div>
        </Link>
      </section>

      <section>
        <PromptPlayer />
      </section>

      <section className="centered-component">
        <div className="bottom-container">
          <Link to="/play/MEM">How to Play</Link>
          <Link to="/lobby/MEM">Privacy Policy</Link>
        </div>
      </section>
    </div>
  );
};

export default HomeScreen;
