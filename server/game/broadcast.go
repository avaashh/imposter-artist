package game

import (
	"encoding/json"
	"log"

	"imposterArtist/types"

	"github.com/gorilla/websocket"
)

// writer is the package-level hook that actually pushes a JSON envelope
// down a socket. Tests swap it out with a no-op so they can exercise the
// state machine without needing real websockets.
var writer = defaultWriter

func defaultWriter(conn *websocket.Conn, envelope types.Response) {
	if conn == nil {
		return
	}
	data, err := json.Marshal(envelope)
	if err != nil {
		log.Println("broadcast marshal:", err)
		return
	}
	if err := conn.WriteMessage(websocket.TextMessage, data); err != nil {
		log.Println("broadcast write:", err)
	}
}

// send writes a JSON envelope to a single connection. Errors are logged; we
// don't fail callers because the dropped-peer case is handled by the
// disconnect path.
func send(conn *websocket.Conn, envelope types.Response) {
	writer(conn, envelope)
}

// sendTo dispatches the same envelope to a list of connections.
func sendTo(conns []*websocket.Conn, envelope types.Response) {
	for _, c := range conns {
		send(c, envelope)
	}
}

// sendToAllExcept broadcasts to every connection in `conns` except `skip`.
func sendToAllExcept(conns []*websocket.Conn, skip *websocket.Conn, envelope types.Response) {
	for _, c := range conns {
		if c == skip {
			continue
		}
		send(c, envelope)
	}
}
