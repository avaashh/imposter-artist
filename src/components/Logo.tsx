import * as React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/img/logo.svg";

export const LargeLogoHeader = () => {
  return (
    <Link to="/" style={{ textDecoration: "none", color: "black" }}>
      <div className="headerComponent">
        <img src={logo} className="appLogo" alt="Logo" />
        <div className="headerSalutation">
          <h5 className="headerWelcome">Welcome to</h5>
          <h1 className="headerImposter">Imposter Artist!</h1>
        </div>
      </div>
    </Link>
  );
};

export const SmallLogoHeader = () => {
  return (
    <Link to="/" style={{ textDecoration: "none", color: "black" }}>
      <div className="headerComponentSmall">
        <img src={logo} className="appLogoSmall" alt="Logo" />
      </div>
    </Link>
  );
};
