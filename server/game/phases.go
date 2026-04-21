package game

import (
	"log"

	"imposterArtist/types"

	"github.com/gorilla/websocket"
)

// StartGame transitions the room from Waiting → InProgress, assigns roles,
// and fans out per-player `roleAssigned` messages followed by a broadcast
// `gameStarted` envelope. Only the owner may call this, and it requires at
// least 3 players so the social deduction actually works.
func (m *Manager) StartGame(requester *websocket.Conn) error {
	r, _ := m.FindByConn(requester)
	if r == nil {
		return errNotInRoom
	}

	r.mu.Lock()
	if !r.isOwnerConn(requester) {
		r.mu.Unlock()
		return errNotOwner
	}
	if r.Phase != PhaseWaiting {
		r.mu.Unlock()
		return errWrongPhase
	}
	if len(r.Players) < 3 {
		r.mu.Unlock()
		return errTooFewPlayers
	}

	r.Colors = AssignColors(len(r.Players))
	r.Phase = PhaseInProgress
	r.assignRolesLocked()

	// Snapshot the data we need to send before releasing the lock.
	roleTargets := make([]struct {
		conn *websocket.Conn
		msg  types.Response
	}, 0, len(r.Players))
	for i, conn := range r.Conns {
		if conn == nil || i >= len(r.Players) {
			continue
		}
		roleTargets = append(roleTargets, struct {
			conn *websocket.Conn
			msg  types.Response
		}{
			conn: conn,
			msg: types.Response{
				Type:    "roleAssigned",
				Payload: r.roleMessageFor(i),
			},
		})
	}

	snap := r.snapshotLocked()
	turnPayload := map[string]interface{}{
		"success":          true,
		"roomId":           r.RoomId,
		"currentPlayerId":  r.Players[r.TurnIndex].Id,
		"round":            r.Round,
		"totalRounds":      r.Settings.DrawingRoundsLimit,
		"turnDurationSecs": r.Settings.DrawingTime,
		"playerColors":     append([]string(nil), r.Colors...),
	}
	conns := append([]*websocket.Conn(nil), r.Conns...)
	firstDrawer := r.Players[r.TurnIndex].Id
	playerCount := len(r.Players)
	rounds := r.Settings.DrawingRoundsLimit
	r.mu.Unlock()

	log.Printf("[game] started roomId=%s players=%d rounds=%d firstDrawer=%s",
		snap.RoomId, playerCount, rounds, firstDrawer)

	// Private role DMs first…
	for _, t := range roleTargets {
		send(t.conn, t.msg)
	}
	// …then a public "gameStarted" envelope with the room snapshot.
	sendTo(conns, types.Response{
		Type: "gameStarted",
		Payload: map[string]interface{}{
			"success":      true,
			"roomId":       snap.RoomId,
			"gameRoom":     snap,
			"playerColors": snap.PlayerColors,
		},
	})
	// …and a turnStart so the canvas knows whose turn it is.
	sendTo(conns, types.Response{Type: "turnStart", Payload: turnPayload})

	r.mu.Lock()
	r.startTurnTimerLocked()
	r.mu.Unlock()
	return nil
}
