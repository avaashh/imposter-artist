package game

import (
	"imposterArtist/types"

	"github.com/gorilla/websocket"
)

// Scoring values for a single completed game.
const (
	artistWinPoints   = 1
	imposterWinPoints = 2
)

// SubmitVote records a voter's choice. When every player has voted the
// room tallies results, awards points, transitions to PhaseEnded, and
// broadcasts the gameOver envelope; otherwise a votingUpdate goes out so
// everyone can see the progress bar move.
func (m *Manager) SubmitVote(conn *websocket.Conn, targetId string) error {
	r, _ := m.FindByConn(conn)
	if r == nil {
		return errNotInRoom
	}

	r.mu.Lock()
	if r.Phase != PhaseVoting {
		r.mu.Unlock()
		return errWrongPhase
	}
	voterIdx := r.playerIndexByConn(conn)
	if voterIdx < 0 {
		r.mu.Unlock()
		return errNotInRoom
	}
	voterId := r.Players[voterIdx].Id
	if _, already := r.Votes[voterId]; already {
		r.mu.Unlock()
		return errAlreadyVoted
	}
	if r.playerIndexById(targetId) < 0 {
		r.mu.Unlock()
		return errInvalidVote
	}
	r.Votes[voterId] = targetId

	update := r.votingUpdateLocked()
	conns := r.connsLocked()

	if len(r.Votes) >= len(r.Players) {
		result := r.finalizeGameLocked()
		r.mu.Unlock()
		sendTo(conns, types.Response{Type: "votingUpdate", Payload: update})
		sendTo(conns, types.Response{Type: "gameOver", Payload: result})
		return nil
	}
	r.mu.Unlock()
	sendTo(conns, types.Response{Type: "votingUpdate", Payload: update})
	return nil
}

// votingUpdateLocked shapes a progress envelope. It reveals only *who* has
// voted so far, never what they voted for — that stays secret until the
// gameOver reveal.
func (r *Room) votingUpdateLocked() map[string]interface{} {
	voted := make([]string, 0, len(r.Votes))
	for id := range r.Votes {
		voted = append(voted, id)
	}
	return map[string]interface{}{
		"success":        true,
		"roomId":         r.RoomId,
		"votedPlayerIds": voted,
		"totalVotes":     len(r.Votes),
		"totalPlayers":   len(r.Players),
	}
}

// finalizeGameLocked tallies votes, decides the winner, updates scores, and
// flips the room into PhaseEnded. Ties (including everyone voting for a
// different person) count as an imposter escape — the artists didn't agree
// on a suspect, so the imposter gets away with it.
func (r *Room) finalizeGameLocked() map[string]interface{} {
	tally := map[string]int{}
	for _, target := range r.Votes {
		tally[target]++
	}

	var topId string
	topCount := -1
	tieCount := 0
	for id, c := range tally {
		if c > topCount {
			topId = id
			topCount = c
			tieCount = 1
			continue
		}
		if c == topCount {
			tieCount++
		}
	}

	imposterId := r.Players[r.Imposter].Id
	imposterCaught := tieCount == 1 && topId == imposterId
	imposterWon := !imposterCaught

	if imposterWon {
		r.Scores[imposterId] += imposterWinPoints
	} else {
		for i, p := range r.Players {
			if i != r.Imposter {
				r.Scores[p.Id] += artistWinPoints
			}
		}
	}

	r.Phase = PhaseEnded
	r.LastResult = &GameResult{
		ImposterWon:      imposterWon,
		ImposterPlayerId: imposterId,
		SecretWord:       r.SecretWord,
		VoteTally:        tally,
	}

	scores := make(map[string]int, len(r.Scores))
	for k, v := range r.Scores {
		scores[k] = v
	}

	return map[string]interface{}{
		"success":          true,
		"roomId":           r.RoomId,
		"imposterWon":      imposterWon,
		"imposterPlayerId": imposterId,
		"secretWord":       r.SecretWord,
		"voteTally":        tally,
		"scores":           scores,
	}
}

// PlayAgain resets an Ended room back to Waiting so the same lobby can spin
// up a fresh round with a new imposter and a new word. Scores accumulate
// across games; only per-game state is cleared.
func (m *Manager) PlayAgain(conn *websocket.Conn) error {
	r, _ := m.FindByConn(conn)
	if r == nil {
		return errNotInRoom
	}

	r.mu.Lock()
	if !r.isOwnerConn(conn) {
		r.mu.Unlock()
		return errNotOwner
	}
	if r.Phase != PhaseEnded {
		r.mu.Unlock()
		return errWrongPhase
	}

	r.stopTurnTimerLocked()
	r.Phase = PhaseWaiting
	r.Round = 0
	r.TurnIndex = 0
	r.Imposter = 0
	r.SecretWord = ""
	r.Votes = map[string]string{}
	r.LastResult = nil

	snap := r.snapshotLocked()
	conns := r.connsLocked()
	r.mu.Unlock()

	sendTo(conns, types.Response{
		Type: "roomReset",
		Payload: map[string]interface{}{
			"success":  true,
			"roomId":   snap.RoomId,
			"gameRoom": snap,
		},
	})
	return nil
}
