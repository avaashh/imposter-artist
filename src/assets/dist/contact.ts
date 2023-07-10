//

import { StoreGameRoom } from "../../utils/storage/storage-container";

export const handleIncomingMessages = (
  message: any,
  navigate: (v: any) => void,
  toast: (v: any, k: any) => void
) => {
  // console.log(message);
  switch (message.type) {
    case "createGame":
      if (message.payload.success) {
        const currentRoom = message.payload.gameRoom;
        StoreGameRoom(currentRoom);

        navigate(`/lobby/${message.payload.gameRoom.roomId}`);
      } else
        toast(message.payload.err, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
      return;
    case "joinGameWithCode":
      if (message.payload.success) {
        const currentRoom = message.payload.gameRoom;
        StoreGameRoom(currentRoom);

        navigate(`/lobby/${message.payload.gameRoom.roomId}`);
      } else
        toast(message.payload.err, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
      return;
    default:
      return;
  }
};
