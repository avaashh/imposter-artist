// React and Utils imports
import * as React from "react";

// redux imports
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "../../utils/storage/store";

import * as storage from "../../utils/storage/storage-container";

import { Outlet, useNavigate } from "react-router-dom";
import Server, { SocketContext } from "../../assets/dist/server";

import { toast } from "react-toastify";

import "../styles/App.css";
import "react-toastify/dist/ReactToastify.css";

import Loader from "../Loader";
import { handleIncomingMessages } from "../../assets/dist/contact";

const App = () => {
  const [socket, setSocket] = React.useState<Server | null>(null);
  const [loadComplete, setLoadComplete] = React.useState(false);

  const [socketConnected, setSocketConnected] = React.useState(false);

  const navigate = useNavigate();
  const onSocketMessageHandler = (received: any) =>
    handleIncomingMessages(received, navigate, toast);

  window.onbeforeunload = () => {
    storage.StoreGameRoom(null);
  };

  React.useEffect(() => {
    const load = async () => {
      const player = storage.ThisPlayer();
      storage.StorePlayer(player);
    };

    load()
      .then(
        () =>
          socket === null &&
          setSocket(
            new Server(onSocketMessageHandler, () => setSocketConnected(true))
          )
      )
      .then(() => setLoadComplete(true));
  });

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {loadComplete && socketConnected ? (
          <SocketContext.Provider value={{ server: socket }}>
            <Outlet />
          </SocketContext.Provider>
        ) : (
          <Loader />
        )}
      </PersistGate>
    </Provider>
  );
};

export default App;
