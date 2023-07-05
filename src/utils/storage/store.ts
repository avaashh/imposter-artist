import { createStore } from "redux";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage"; // defaults to localStorage for web

import reducer from "./reducer"; //  root reducer

// Configure persistence options
const persistConfig = {
  key: "root", // key for localStorage
  storage,
};

const persistedReducer = persistReducer(persistConfig, reducer);

// Create the Redux store
const store = createStore(persistedReducer);
const persistor = persistStore(store);

export { store, persistor };
