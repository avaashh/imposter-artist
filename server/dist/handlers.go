package dist

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"imposterArtist/database"
	"imposterArtist/web"

	"github.com/gorilla/websocket"
)

func AppServer() {
	http.HandleFunc("/ws", handleWebSocket)
	fmt.Println("Webserver started on port", ServerPort)
	
	err := (http.ListenAndServe(":" + ServerPort, nil))
	if err != nil {
		log.Fatal(err)
	}
}

func handleIncomingRequest(req Request, conn *websocket.Conn, messageType int) Response {
	var res Response

	res.ID = req.ID
	res.Type = req.Type
	res.Payload = map[string]interface{} {"success": false}

	response, ok := res.Payload.(map[string]interface{})
	if !ok {
		response["err"] = "Could not form response"
		return res
	}

	payload, ok := req.Payload.(map[string]interface{})
	if !ok {
		response["err"] = "Could not understand payload"
		return res
	}

	// map payload to bytes
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		response["err"] = err
		return res
	}

	switch res.Type {
	case web.ActionCreateGame:
		// Create a Game, payload should be interface GameRoom

		var gameRoom GameRoom

		err := json.Unmarshal(payloadBytes, &gameRoom)
		if err != nil {
			response["err"] = "Could not understand request"
			return res
		}

		gameRoom.PlayersConn = append(gameRoom.PlayersConn, conn)
		if !database.Store("gamerooms", gameRoom.RoomId, gameRoom, false) {
			response["err"] = "Game already exists"
			return res
		}

		response["success"] = true
		response["gameRoom"] = gameRoom
		return res
	
	case web.ActionJoinGameWithCode:
		roomId, idOk := payload["gameRoomId"].(string)
		tryRequestedBy, playerOk := payload["player"]

		if !idOk || !playerOk {
			response["err"] = "Could not understand request"
			return res
		}

		var requestedBy Player;
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
		
		roomInfo := roomSearch.(GameRoom)
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
		
	case web.ActionStartGame:
		// payload: interface{} = {roomId: gameRoomId}

		room, err := database.Fetch("gamerooms", payload["roomId"].(string))
		if err != nil {
			response["err"] = "Could not find game room"
			return res
		}

		gameRoom := room.(GameRoom)
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

	default:
		response["err"] = "Could not understand request"
		return res
	}
}