package game

import (
	"imposterArtist/types"

	"github.com/gorilla/websocket"
)

// silenceBroadcasts swaps the package-level writer for a no-op. Tests call
// this in init() so they can exercise Manager methods (which fan out via
// send/sendTo) without needing real websockets. The writer is process-global,
// so all tests share this stub — nothing in the suite needs real sockets.
func init() {
	writer = func(*websocket.Conn, types.Response) {}
}

// newTestPlayer builds a Player with a stable id, convenient for asserting
// indices and vote tallies.
func newTestPlayer(id string) types.Player {
	return types.Player{
		Id:         id,
		PlayerName: id,
	}
}

// newTestConn returns a fresh pointer to a zero-valued websocket.Conn. We
// only ever compare these by pointer identity and use them as map keys; the
// test writer stub ensures no method on the Conn is ever invoked.
func newTestConn() *websocket.Conn {
	return &websocket.Conn{}
}
