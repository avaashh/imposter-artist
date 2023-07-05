// React and Utils imports
import * as React from "react";

// redux imports
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "../../utils/storage/store";

import * as storage from "../../utils/storage/storage-container";
import { newPlayerId, newPlayerName } from "../../utils/defaultCreate";

import { Outlet } from "react-router-dom";

const App = () => {
  const [loadComplete, setLoadComplete] = React.useState(false);

  React.useEffect(() => {
    const load = async () => {
      if (storage.ThisPlayer() === undefined || storage.ThisPlayer() === null) {
        storage.StorePlayer(newPlayerId(), newPlayerName());
      }
      storage.CheckState();
    };

    load().then(() => setLoadComplete(true));
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {loadComplete && <Outlet />}
      </PersistGate>
    </Provider>
  );
};

export default App;
