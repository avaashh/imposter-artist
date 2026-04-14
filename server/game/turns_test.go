package game

import (
	"testing"

	"imposterArtist/types"

	"github.com/gorilla/websocket"
)

// newRoomInProgress builds an in-progress room with n real players, a 2-round
// limit, and a large turn timer so the auto-advance goroutine never fires
// during a test. We stop the timer at the end of every assertion that doesn't
// want it lingering.
func newRoomInProgress(t *testing.T, n, rounds int) *Room {
	t.Helper()
	players := make([]types.Player, n)
	for i := 0; i < n; i++ {
		players[i] = newTestPlayer(string(rune('a' + i)))
	}
	return &Room{
		RoomId:  "ROOM",
		Players: players,
		Conns:   make([]*websocket.Conn, n),
		Phase:   PhaseInProgress,
		Round:   1,
		Settings: types.GameRoomSettings{
			DrawingTime:        999,
			DrawingRoundsLimit: rounds,
		},
	}
}

func TestAdvanceTurnLocked_NormalIncrement(t *testing.T) {
	r := newRoomInProgress(t, 3, 2)
	r.TurnIndex = 0
	tr := r.advanceTurnLocked()
	defer r.stopTurnTimerLocked()

	if r.TurnIndex != 1 {
		t.Errorf("TurnIndex = %d, want 1", r.TurnIndex)
	}
	if r.Round != 1 {
		t.Errorf("Round = %d, want 1 (still mid-round)", r.Round)
	}
	if tr.kind != "turnStart" {
		t.Errorf("transition kind = %q, want turnStart", tr.kind)
	}
}

func TestAdvanceTurnLocked_WrapsAtEndOfRound(t *testing.T) {
	r := newRoomInProgress(t, 3, 2)
	r.TurnIndex = 2
	tr := r.advanceTurnLocked()
	defer r.stopTurnTimerLocked()

	if r.TurnIndex != 0 {
		t.Errorf("TurnIndex = %d, want 0 at round start", r.TurnIndex)
	}
	if r.Round != 2 {
		t.Errorf("Round = %d, want 2 after wrap", r.Round)
	}
	if tr.kind != "turnStart" {
		t.Errorf("transition kind = %q, want turnStart", tr.kind)
	}
}

func TestAdvanceTurnLocked_TransitionsToVotingAfterFinalRound(t *testing.T) {
	r := newRoomInProgress(t, 3, 2)
	r.Round = 2
	r.TurnIndex = 2
	tr := r.advanceTurnLocked()

	if r.Phase != PhaseVoting {
		t.Errorf("Phase = %q, want %q", r.Phase, PhaseVoting)
	}
	if tr.kind != "votingStarted" {
		t.Errorf("transition kind = %q, want votingStarted", tr.kind)
	}
	if r.Votes == nil {
		t.Error("Votes map should be initialized on voting transition")
	}
	// Timer must not be started once we're voting — an orphan timer could
	// fire and re-enter advanceTurnLocked.
	if r.turnTimer != nil {
		t.Error("turnTimer should not be started on voting transition")
	}
}
