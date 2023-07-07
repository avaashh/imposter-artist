package dist

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"imposterArtist/database"
	"imposterArtist/web"
)

func AppServer() {
	http.HandleFunc("/ws", handleWebSocket)
	fmt.Printf("Webserver started on port %s", ServerPort)
	
	err := (http.ListenAndServe(":" + ServerPort, nil))
	if err != nil {
		log.Fatal(err)
	}
}

func handleIncomingRequest(req Request) Response {
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

		if !database.Store("gamerooms", gameRoom.RoomId, gameRoom) {
			response["err"] = "Game already exists"
			return res
		}

		response["success"] = true
		response["gameRoomId"] = gameRoom.RoomId
		return res
	
	default:
		response["err"] = "Could not understand request"
		return res
	}
}