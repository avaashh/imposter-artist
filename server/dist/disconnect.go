package dist

import "github.com/gorilla/websocket"

// handleDisconnect is a stub; connection-aware cleanup lands with the
// full game state machine.
func handleDisconnect(_ *websocket.Conn) {}
