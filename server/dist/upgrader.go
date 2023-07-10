package dist

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var Upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		// Allowing connections only from "https" URLs
		return true // r.URL.Scheme == "https"
	},
}

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	// Upgrade HTTP connection to a WebSocket connection
	conn, err := Upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Failed to upgrade connection:", err)
		return
	}

	defer conn.Close()

	for {
		// Read message from the client
		messageType, msg, err := conn.ReadMessage()
		if err != nil {
			// this means player has disconnected
			break
		}

		// Unmarshal received JSON data into a map
		var receivedQuery Request
		err = json.Unmarshal(msg, &receivedQuery)
		if err != nil {
			// Failed to unmarshal JSON
			log.Println("Failed to unmarshal JSON:", err)
			break
		}

		responseToReturn := handleIncomingRequest(receivedQuery, conn, messageType)

		// Convert the map to JSON format
		responseJSON, err := json.Marshal(responseToReturn)
		if err != nil {
			// Failed to marshal JSON
			log.Println("Failed to marshal JSON:", err)
			break
		}

		// Write the JSON response back to the client
		err = conn.WriteMessage(websocket.TextMessage, responseJSON)
		if err != nil {
			// Failed to write message
			log.Println("Failed to write message:", err)
			break
		}
	}
}
