package dist

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"

	"imposterArtist/types"

	"github.com/gorilla/websocket"
)

// allowedOriginsFromEnv parses ALLOWED_ORIGINS (comma-separated) from the
// environment and falls back to a permissive dev default when unset.
func allowedOriginsFromEnv() []string {
	raw := os.Getenv("ALLOWED_ORIGINS")
	if strings.TrimSpace(raw) == "" {
		return []string{
			"http://localhost:3000",
			"http://127.0.0.1:3000",
		}
	}
	parts := strings.Split(raw, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p == "" {
			continue
		}
		out = append(out, p)
	}
	return out
}

var allowedOrigins = allowedOriginsFromEnv()

// allowAnyOrigin lets operators explicitly opt into a fully-open upgrader
// (e.g. for local ngrok testing) by setting ALLOWED_ORIGINS=*.
func allowAnyOrigin() bool {
	for _, o := range allowedOrigins {
		if o == "*" {
			return true
		}
	}
	return false
}

func isAllowedOrigin(origin string) bool {
	if origin == "" {
		// Same-origin browsers (and non-browser clients) may omit Origin;
		// allow only when running in dev mode.
		return allowAnyOrigin()
	}
	if allowAnyOrigin() {
		return true
	}
	for _, o := range allowedOrigins {
		if strings.EqualFold(o, origin) {
			return true
		}
	}
	return false
}

var Upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return isAllowedOrigin(r.Header.Get("Origin"))
	},
	ReadBufferSize:  4096,
	WriteBufferSize: 4096,
}

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	// Upgrade HTTP connection to a WebSocket connection
	conn, err := Upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Failed to upgrade connection:", err)
		return
	}

	defer conn.Close()
	defer handleDisconnect(conn)

	for {
		// Read message from the client
		messageType, msg, err := conn.ReadMessage()
		if err != nil {
			// this means player has disconnected
			break
		}

		// Unmarshal received JSON data into a map
		var receivedQuery types.Request
		err = json.Unmarshal(msg, &receivedQuery)
		if err != nil {
			// Failed to unmarshal JSON
			log.Println("Failed to unmarshal JSON:", err)
			continue
		}

		responseToReturn := handleIncomingRequest(receivedQuery, conn, messageType)

		// Convert the map to JSON format
		responseJSON, err := json.Marshal(responseToReturn)
		if err != nil {
			// Failed to marshal JSON
			log.Println("Failed to marshal JSON:", err)
			continue
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
