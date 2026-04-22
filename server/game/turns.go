package game

import (
	"log"
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

// startTurnTimerLocked records when the current turn began. The countdown
// auto-advance was removed: turns now end only when the drawer hits "End my
// turn" or when a disconnect forces recovery. We keep the timestamp so we
// can still log turn durations if we ever want to.
func (r *Room) startTurnTimerLocked() {
	r.TurnStartedAt = time.Now()
}

// stopTurnTimerLocked is kept as a stub so the leave/endTurn paths can still
// call it without a special case. No timer means nothing to cancel.
func (r *Room) stopTurnTimerLocked() {
	r.turnTimer = nil
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
		log.Printf("[phase] voting started roomId=%s players=%d", r.RoomId, len(r.Players))
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
	log.Printf("[turn] advance roomId=%s round=%d/%d turnIdx=%d drawer=%s",
		r.RoomId, r.Round, r.Settings.DrawingRoundsLimit, r.TurnIndex, r.Players[r.TurnIndex].Id)
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

// AcceptStroke authorizes a stroke and relays it to every other player in
// the room. The drawer controls when their turn ends (via EndTurnByConn) —
// we do not auto-advance here, so a single turn can contain many strokes.
// Only the current drawer may submit strokes; everyone else is rejected so
// a client bug or malicious peer can't paint on their behalf.
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
	return nil
}

// AcceptStrokeProgress relays an in-progress stroke delta from the current
// drawer to every other player so viewers can watch the stroke render live.
// The payload carries only the points added since the last progress send,
// plus an isStart flag marking the first delta of a fresh stroke. Nothing is
// persisted — the completed stroke still arrives via AcceptStroke on mouse
// up, and that is what commits to everyone's stroke list.
func (m *Manager) AcceptStrokeProgress(conn *websocket.Conn, points types.Stroke, isStart bool) error {
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
	r.mu.Unlock()

	sendTo(others, types.Response{
		Type: "strokeProgress",
		Payload: map[string]interface{}{
			"success":  true,
			"roomId":   roomId,
			"points":   points,
			"isStart":  isStart,
			"playerId": drawerId,
		},
	})
	return nil
}
