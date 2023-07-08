// React and Utils imports
import * as React from "react";

// redux imports
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "../../utils/storage/store";

import * as storage from "../../utils/storage/storage-container";

import { Outlet } from "react-router-dom";
import Server, { SocketContext } from "../../assets/dist/server";

import { ToastContainer } from "react-toastify";

import Loader from "../Loader";

const App = () => {
  const [socket, setSocket] = React.useState<Server | null>(null);
  const [loadComplete, setLoadComplete] = React.useState(false);

  const [socketConnected, setSocketConnected] = React.useState(false);

  React.useEffect(() => {
    const load = async () => {
      const player = storage.ThisPlayer();
      storage.StorePlayer(player);
    };

    load()
      .then(() => setSocket(new Server(() => setSocketConnected(true))))
      .then(() => setLoadComplete(true));
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ToastContainer />
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
