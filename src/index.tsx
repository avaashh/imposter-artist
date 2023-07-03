// React and Utils imports
import * as React from "react";

// Styling
import "./index.css";

//  Routing Functionality Library
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Pages for Web App
import App from "./components/app/App";
import HomeScreen from "./components/app/Home";
import LobbyScreen from "./components/app/Lobby";
import GameCanvas from "./components/app/GameCanvas";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<HomeScreen />} />
          <Route path="/lobby/:gameID" element={<LobbyScreen />} />
          <Route path="/play/:gameID" element={<GameCanvas />} />
          <Route path="*" element={<HomeScreen />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
