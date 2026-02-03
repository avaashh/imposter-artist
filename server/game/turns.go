package game

import (
	"time"

	"github.com/gorilla/websocket"
)

// startTurnTimerLocked is stubbed during P2a; the server-authoritative timer
// that auto-advances turns on expiry ships in the next commit.
func (r *Room) startTurnTimerLocked() {
	r.TurnStartedAt = time.Now()
}

// stopTurnTimerLocked is the counterpart cancel hook.
func (r *Room) stopTurnTimerLocked() {
	if r.turnTimer != nil {
		r.turnTimer.Stop()
		r.turnTimer = nil
	}
}

// AcceptStroke authorizes and broadcasts a stroke from `conn`. For P2a we
// accept any conn in the room while in InProgress; P2b tightens this to the
// current-turn player and auto-advances on drawing.
func (m *Manager) AcceptStroke(conn *websocket.Conn, stroke []interface{}) (*Room, []*websocket.Conn, bool) {
	r, _ := m.FindByConn(conn)
	if r == nil {
		return nil, nil, false
	}
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.Phase != PhaseInProgress {
		return r, nil, false
	}
	conns := append([]*websocket.Conn(nil), r.Conns...)
	return r, conns, true
}
