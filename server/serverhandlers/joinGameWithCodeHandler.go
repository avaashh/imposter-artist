package serverhandlers

import (
	"encoding/json"

	"imposterArtist/database"
	"imposterArtist/types"

	"github.com/gorilla/websocket"
)

func HandleJoinRoomWithCode (
	
	payload map[string]interface{},
	conn *websocket.Conn,
	messageType int,
	response map[string]interface{},
	res types.Response,

) types.Response {
	roomId, idOk := payload["gameRoomId"].(string)
	tryRequestedBy, playerOk := payload["player"]

	if !idOk || !playerOk {
		response["err"] = "Could not understand request"
		return res
	}

	var requestedBy types.Player;
	marsh, _ := json.Marshal(tryRequestedBy)
	err := json.Unmarshal(marsh, &requestedBy)
	if err != nil {
		response["err"] = err
		return res
	}

	roomSearch, err := database.Fetch("gamerooms", roomId)
	if err != nil {
		response["err"] = "Room does not exist"
		return res
	}
	
	roomInfo := roomSearch.(types.GameRoom)
	if roomInfo.Settings.MaxPlayersInRoom == len(roomInfo.PlayersInRoom) {
		response["err"] = "Room is full"
		return res
	}

	if roomInfo.GameState == "inProgress" {
		response["err"] = "Game is already in progress"
		return res
	}

	ok := false
	for _, player := range roomInfo.PlayersInRoom {
		if player.Id == requestedBy.Id {
			ok = true
			break
		}
	}
	if !ok {
		roomInfo.PlayersInRoom= append(roomInfo.PlayersInRoom, requestedBy)
		roomInfo.PlayersConn = append(roomInfo.PlayersConn, conn)
	}

	database.Store("gamerooms", roomInfo.RoomId, roomInfo, true)
	
	currType := res.Type
	res.Type = "playerJoinedGame"
	
	response["success"] = true
	response["player"] = requestedBy
	byteReturn, _ := json.Marshal(res)

	for _, c := range roomInfo.PlayersConn {
		if c != conn {
			c.WriteMessage(messageType, byteReturn)
		}
	}
	
	res.Type = currType
	response["gameRoom"] = roomInfo
	return res
}