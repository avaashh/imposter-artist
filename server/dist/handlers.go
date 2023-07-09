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
	fmt.Printf("Webserver started on port %s", ServerPort)
	
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
		// Create a Game, payload.gameRoom should be interface GameRoom

		var gameRoom GameRoom

		err := json.Unmarshal(payloadBytes, &gameRoom)
		if err != nil {
			response["err"] = err
			return res
		}

		gameRoom.PlayersConn = append(gameRoom.PlayersConn, conn)
		if !database.Store("gamerooms", gameRoom.RoomId, gameRoom, false) {
			response["err"] = "Game already exists"
			return res
		}

		response["success"] = true
		response["gameRoomId"] = gameRoom.RoomId
		return res
	
	case web.ActionJoinGameWithCode:
		fmt.Println(payload)

		roomId, idOk := payload["gameRoomId"].(string)
		tryRequestedBy, playerOk := payload["player"]

		if !idOk || !playerOk {
			response["err"] = "Could not understand request"
			return res
		}

		var requestedBy Player;
		marsh, _ :=json.Marshal(tryRequestedBy)
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

		roomInfo.PlayersInRoom = append(roomInfo.PlayersInRoom, requestedBy)
		roomInfo.PlayersConn = append(roomInfo.PlayersConn, conn)

		database.Store("gamerooms", roomInfo.RoomId, roomInfo, true)
		
		currType := res.Type
		res.Type = "playerJoinedGame"
		
		response["success"] = true
		response["player"] = requestedBy
		byteReturn, _ := json.Marshal(res)

		for _, c := range roomInfo.PlayersConn {
			if  c!= conn {
				c.WriteMessage(messageType, byteReturn)
			}
		}
		
		res.Type = currType
		response["gameRoom"] = roomInfo
		return res
		
	default:
		response["err"] = "Could not understand request"
		return res
	}
}