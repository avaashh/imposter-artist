package serverhandlers

import (
	"encoding/json"

	"imposterArtist/database"
	"imposterArtist/types"

	"github.com/gorilla/websocket"
)

func HandleStartGame(

	roomId string,
	conn *websocket.Conn,
	messageType int,
	response map[string]interface{},
	res types.Response,

) types.Response {

	room, err := database.Fetch("gamerooms", roomId)
	if err != nil {
		response["err"] = "Could not find game room"
		return res
	}

	gameRoom := room.(types.GameRoom)
	gameRoom.GameState = "inProgress"

	playerColors, err := database.Colors(0, len(gameRoom.PlayersInRoom))
	if err != nil {
		response["err"] = "Too many players in room"
		return res
	}

	gameRoom.PlayerColors = playerColors
	database.Store("gamerooms", gameRoom.RoomId, gameRoom, true)

	response["success"] = true
	response["roomId"] = gameRoom.RoomId
	response["playerColors"] = playerColors
	byteReturn, _ := json.Marshal(res)


	for _, c := range gameRoom.PlayersConn {
		if c != conn {
			c.WriteMessage(messageType, byteReturn)
		}
	}
	return res
}