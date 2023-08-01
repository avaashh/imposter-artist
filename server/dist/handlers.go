package dist

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"imposterArtist/serverhandlers"
	"imposterArtist/types"
	"imposterArtist/web"

	"github.com/gorilla/websocket"
)

func AppServer() {
	http.HandleFunc("/ws", handleWebSocket)
	fmt.Println("Webserver started on port", types.ServerPort)
	
	err := (http.ListenAndServe(":" + types.ServerPort, nil))
	if err != nil {
		log.Fatal(err)
	}
}

func handleIncomingRequest(req types.Request, conn *websocket.Conn, messageType int) types.Response {
	var res types.Response

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
		return serverhandlers.HandleCreateAGame(
			payloadBytes, response, res, conn,
		)
	
	case web.ActionJoinGameWithCode:
		return serverhandlers.HandleJoinRoomWithCode(
			payload, conn, messageType, response, res,
		)
		
	case web.ActionStartGame:
		// payload: interface{} = {roomId: gameRoomId}
		return serverhandlers.HandleStartGame(
			payload["roomId"].(string),
			conn, messageType, response, res,
		)

	case web.ActionSendStroke:
		strokeData, ok := payload["stroke"].([]interface{})
		if !ok {
			response["err"] = "Could not understand request"
			return res
		}
		
		return serverhandlers.HandleIncomingStrokes(
			payload["roomId"].(string),
			strokeData,
			conn,
			messageType,
			response,
			res,
		)

	default:
		response["err"] = "Could not understand request"
		return res
	}
}