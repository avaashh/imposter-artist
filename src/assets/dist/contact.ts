//

export const handleIncomingMessages = (
  message: any,
  navigate: (v: any) => void,
  toast: (v: any, k: any) => void
) => {
  console.log(message);
  switch (message.type) {
    case "createGame":
      if (message.payload.success)
        navigate(`/lobby/${message.payload.gameRoomId}`);
      else
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
      if (message.payload.success)
        navigate(`/lobby/${message.payload.gameRoom.roomId}`);
      else
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
    case "playerJoinedGame":
      console.log(message);
      return;
  }
};
