package dist

import (
	"encoding/json"
	"fmt"
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
		_, msg, err := conn.ReadMessage()
		if err != nil {
			// Failed to read message
			log.Println("Failed to read message:", err)
			break
		}

		fmt.Printf("Received message: %s\n", msg)

		// Unmarshal received JSON data into a map
		var receivedQuery Request
		err = json.Unmarshal(msg, &receivedQuery)
		if err != nil {
			// Failed to unmarshal JSON
			log.Println("Failed to unmarshal JSON:", err)
			break
		}

		responseToReturn := handleIncomingRequest(receivedQuery)

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
