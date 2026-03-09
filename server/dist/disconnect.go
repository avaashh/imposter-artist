package dist

import (
	"imposterArtist/game"

	"github.com/gorilla/websocket"
)

// handleDisconnect is invoked from the WebSocket upgrader's defer when a
// client socket closes. It routes the cleanup through the same path as an
// explicit leaveGame so ownership transfer, turn recovery, and abandonment
// semantics stay in one place.
func handleDisconnect(conn *websocket.Conn) {
	if conn == nil {
		return
	}
	game.Default.LeavePlayerByConn(conn)
}
