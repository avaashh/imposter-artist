import * as React from "react";
import { Link } from "react-router-dom";

import background from "../../assets/img/background.svg";
import logo from "../../assets/img/logo.svg";
import "../styles/Home.css";

import { DefaultButton } from "../Buttons";

import { ChangeablePlayerTag } from "../PlayerTag";
import CharacterTag from "../CharacterTag";

const PromptPlayer = () => {
  return (
    <div className="promptParent">
      <div className="promptContainer">
        <ChangeablePlayerTag />
        <CharacterTag withRefresh={true} />
        <div style={{ display: "flex", flexDirection: "row" }}>
          <DefaultButton label={"Create a game"} />
          <DefaultButton label={"Join a room"} />
        </div>
      </div>
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
        <div className="headerComponent">
          <img src={logo} className="appLogo" alt="Logo" />
          <div className="headerSalutation">
            <h5 className="headerWelcome">Welcome to</h5>
            <h1 className="headerImposter">Imposter Artist!</h1>
          </div>
        </div>
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
