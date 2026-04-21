package game

import (
	"log"

	"imposterArtist/types"

	"github.com/gorilla/websocket"
)

// LeavePlayerByConn is the single entry point for both a player-initiated
// leaveGame action and an unexpected websocket close. It untangles the
// room's indices, transfers ownership when the owner walks out, keeps the
// turn rotation sensible when the current drawer leaves, and — if too few
// players remain to finish the game — ends it with an imposter escape.
func (m *Manager) LeavePlayerByConn(conn *websocket.Conn) {
	r, playerId := m.FindByConn(conn)
	m.dropConnIndex(conn)
	if r == nil || playerId == "" {
		return
	}

	r.mu.Lock()
	idx := r.playerIndexById(playerId)
	if idx < 0 {
		r.mu.Unlock()
		return
	}

	wasOwner := r.Players[idx].Id == r.Owner.Id
	wasDrawer := r.Phase == PhaseInProgress && idx == r.TurnIndex
	prevPhase := r.Phase

	r.removePlayerAtLocked(idx)
	log.Printf("[room] player left roomId=%s player=%s phase=%s remaining=%d",
		r.RoomId, playerId, prevPhase, len(r.Players))

	// Empty room? Tear it down entirely.
	if len(r.Players) == 0 {
		r.stopTurnTimerLocked()
		roomId := r.RoomId
		r.mu.Unlock()
		m.removeRoom(roomId)
		return
	}

	// Transfer ownership if the owner left.
	var newOwner *types.Player
	if wasOwner {
		r.Owner = r.Players[0]
		newOwnerCopy := r.Owner
		newOwner = &newOwnerCopy
		log.Printf("[room] ownership transferred roomId=%s newOwner=%s", r.RoomId, newOwnerCopy.Id)
	}

	// Phase-specific follow-up (new turn, voting, or game-over).
	var finalizedPayload map[string]interface{}
	var followUp turnTransition
	followUpValid := false

	switch r.Phase {
	case PhaseInProgress:
		if len(r.Players) < 3 {
			finalizedPayload = r.finalizeByAbandonmentLocked()
			break
		}
		if wasDrawer {
			r.stopTurnTimerLocked()
			if r.TurnIndex >= len(r.Players) {
				r.TurnIndex = 0
				r.Round++
			}
			if r.Round > r.Settings.DrawingRoundsLimit {
				r.Phase = PhaseVoting
				r.Votes = map[string]string{}
				followUp = turnTransition{
					kind:  "votingStarted",
					conns: r.connsLocked(),
					payload: map[string]interface{}{
						"success":      true,
						"roomId":       r.RoomId,
						"totalPlayers": len(r.Players),
					},
				}
			} else {
				r.startTurnTimerLocked()
				followUp = turnTransition{
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
			followUpValid = true
		}
	case PhaseVoting:
		delete(r.Votes, playerId)
		if len(r.Players) < 3 {
			finalizedPayload = r.finalizeByAbandonmentLocked()
			break
		}
		if len(r.Votes) >= len(r.Players) {
			finalizedPayload = r.finalizeGameLocked()
		}
	}

	snap := r.snapshotLocked()
	conns := r.connsLocked()
	r.mu.Unlock()

	sendTo(conns, types.Response{
		Type: "playerLeftGame",
		Payload: map[string]interface{}{
			"success":  true,
			"roomId":   snap.RoomId,
			"playerId": playerId,
			"gameRoom": snap,
		},
	})
	if newOwner != nil {
		sendTo(conns, types.Response{
			Type: "ownerChanged",
			Payload: map[string]interface{}{
				"success":  true,
				"roomId":   snap.RoomId,
				"newOwner": *newOwner,
			},
		})
	}
	if finalizedPayload != nil {
		sendTo(conns, types.Response{Type: "gameOver", Payload: finalizedPayload})
	}
	if followUpValid {
		broadcastTransition(followUp)
	}
}

// removePlayerAtLocked drops the player at `idx` and keeps dependent
// indices (Imposter, TurnIndex) pointing at the right slots.
func (r *Room) removePlayerAtLocked(idx int) {
	if idx < 0 || idx >= len(r.Players) {
		return
	}
	r.Players = append(r.Players[:idx], r.Players[idx+1:]...)
	if idx < len(r.Conns) {
		r.Conns = append(r.Conns[:idx], r.Conns[idx+1:]...)
	}
	if idx < len(r.Colors) {
		r.Colors = append(r.Colors[:idx], r.Colors[idx+1:]...)
	}

	if r.Imposter == idx {
		r.Imposter = -1
	} else if idx < r.Imposter {
		r.Imposter--
	}
	if idx < r.TurnIndex {
		r.TurnIndex--
	}
}

// finalizeByAbandonmentLocked ends a game that can't be completed — either
// because too few players remain or (future) a host aborts. The imposter is
// treated as having escaped; no points change hands.
func (r *Room) finalizeByAbandonmentLocked() map[string]interface{} {
	log.Printf("[game] abandoned roomId=%s remaining=%d", r.RoomId, len(r.Players))
	r.stopTurnTimerLocked()
	r.Phase = PhaseEnded

	imposterId := ""
	if r.Imposter >= 0 && r.Imposter < len(r.Players) {
		imposterId = r.Players[r.Imposter].Id
	}

	r.LastResult = &GameResult{
		ImposterWon:      true,
		ImposterPlayerId: imposterId,
		SecretWord:       r.SecretWord,
		VoteTally:        map[string]int{},
	}

	scores := make(map[string]int, len(r.Scores))
	for k, v := range r.Scores {
		scores[k] = v
	}

	return map[string]interface{}{
		"success":          true,
		"roomId":           r.RoomId,
		"imposterWon":      true,
		"imposterPlayerId": imposterId,
		"secretWord":       r.SecretWord,
		"voteTally":        map[string]int{},
		"scores":           scores,
		"abandoned":        true,
	}
}
