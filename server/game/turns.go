package game

import (
	"time"

	"imposterArtist/types"

	"github.com/gorilla/websocket"
)

// turnTransition describes the broadcast that follows a turn ending: either
// another `turnStart` envelope or the `votingStarted` envelope once every
// round has been played out.
type turnTransition struct {
	kind    string
	conns   []*websocket.Conn
	payload map[string]interface{}
}

// startTurnTimerLocked kicks off a time.AfterFunc that will end the current
// turn automatically if the drawer doesn't end it first. The captured
// (round, turnIndex) lets the callback detect stale fires — e.g. when the
// turn was already ended by endTurn or a disconnect.
func (r *Room) startTurnTimerLocked() {
	r.TurnStartedAt = time.Now()
	round := r.Round
	turnIndex := r.TurnIndex
	duration := time.Duration(r.Settings.DrawingTime) * time.Second
	r.turnTimer = time.AfterFunc(duration, func() {
		r.handleTurnTimeout(round, turnIndex)
	})
}

// stopTurnTimerLocked cancels any pending auto-advance timer.
func (r *Room) stopTurnTimerLocked() {
	if r.turnTimer != nil {
		r.turnTimer.Stop()
		r.turnTimer = nil
	}
}

// handleTurnTimeout runs on the timer goroutine when a turn's duration
// elapses. It re-acquires the room lock, guards against stale fires, then
// advances the turn and broadcasts the transition.
func (r *Room) handleTurnTimeout(expectedRound, expectedTurn int) {
	r.mu.Lock()
	if r.Phase != PhaseInProgress || r.Round != expectedRound || r.TurnIndex != expectedTurn {
		r.mu.Unlock()
		return
	}
	r.turnTimer = nil
	transition := r.advanceTurnLocked()
	r.mu.Unlock()
	broadcastTransition(transition)
}

// advanceTurnLocked moves the room forward one turn. When the final player
// in the final round finishes, the room transitions to the voting phase
// instead of starting another turn. Returns the broadcast the caller should
// fan out after releasing the lock.
func (r *Room) advanceTurnLocked() turnTransition {
	r.TurnIndex++
	if r.TurnIndex >= len(r.Players) {
		r.TurnIndex = 0
		r.Round++
	}
	if r.Round > r.Settings.DrawingRoundsLimit {
		r.Phase = PhaseVoting
		r.Votes = map[string]string{}
		return turnTransition{
			kind:  "votingStarted",
			conns: r.connsLocked(),
			payload: map[string]interface{}{
				"success": true,
				"roomId":  r.RoomId,
			},
		}
	}

	r.startTurnTimerLocked()
	return turnTransition{
		kind:  "turnStart",
		conns: r.connsLocked(),
		payload: map[string]interface{}{
			"success":          true,
			"roomId":           r.RoomId,
			"currentPlayerId":  r.Players[r.TurnIndex].Id,
			"round":            r.Round,
			"totalRounds":      r.Settings.DrawingRoundsLimit,
			"turnDurationSecs": r.Settings.DrawingTime,
		},
	}
}

// connsLocked snapshots the non-nil connections into a fresh slice that is
// safe to iterate outside the lock.
func (r *Room) connsLocked() []*websocket.Conn {
	out := make([]*websocket.Conn, 0, len(r.Conns))
	for _, c := range r.Conns {
		if c != nil {
			out = append(out, c)
		}
	}
	return out
}

// broadcastTransition sends the outgoing envelope described by `t` to every
// connection in the transition.
func broadcastTransition(t turnTransition) {
	if len(t.conns) == 0 || t.kind == "" {
		return
	}
	sendTo(t.conns, types.Response{Type: t.kind, Payload: t.payload})
}

// EndTurnByConn handles a player-initiated endTurn. Only the current drawer
// may call this; the server still owns advancement so a quick double-send
// can't skip anyone.
func (m *Manager) EndTurnByConn(conn *websocket.Conn) error {
	r, _ := m.FindByConn(conn)
	if r == nil {
		return errNotInRoom
	}

	r.mu.Lock()
	if r.Phase != PhaseInProgress {
		r.mu.Unlock()
		return errWrongPhase
	}
	idx := r.playerIndexByConn(conn)
	if idx < 0 {
		r.mu.Unlock()
		return errNotInRoom
	}
	if idx != r.TurnIndex {
		r.mu.Unlock()
		return errNotYourTurn
	}
	r.stopTurnTimerLocked()
	transition := r.advanceTurnLocked()
	r.mu.Unlock()
	broadcastTransition(transition)
	return nil
}

// AcceptStroke authorizes a stroke, relays it to every other player, and —
// because one stroke per turn is the Imposter Artist rule — auto-advances
// the turn. Only the current drawer may submit strokes; everyone else is
// rejected so a client bug or malicious peer can't paint on their behalf.
func (m *Manager) AcceptStroke(conn *websocket.Conn, stroke types.Stroke) error {
	r, _ := m.FindByConn(conn)
	if r == nil {
		return errNotInRoom
	}

	r.mu.Lock()
	if r.Phase != PhaseInProgress {
		r.mu.Unlock()
		return errWrongPhase
	}
	idx := r.playerIndexByConn(conn)
	if idx < 0 {
		r.mu.Unlock()
		return errNotInRoom
	}
	if idx != r.TurnIndex {
		r.mu.Unlock()
		return errNotYourTurn
	}

	drawerId := r.Players[idx].Id
	roomId := r.RoomId
	others := make([]*websocket.Conn, 0, len(r.Conns))
	for _, c := range r.Conns {
		if c != nil && c != conn {
			others = append(others, c)
		}
	}

	r.stopTurnTimerLocked()
	transition := r.advanceTurnLocked()
	r.mu.Unlock()

	sendTo(others, types.Response{
		Type: "sendStroke",
		Payload: map[string]interface{}{
			"success":    true,
			"roomId":     roomId,
			"sentStroke": stroke,
			"playerId":   drawerId,
		},
	})
	broadcastTransition(transition)
	return nil
}
