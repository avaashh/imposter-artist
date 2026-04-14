package game

import (
	"testing"

	"imposterArtist/types"
)

func newFinalizableRoom(imposterIdx int) *Room {
	players := []types.Player{
		newTestPlayer("a"),
		newTestPlayer("b"),
		newTestPlayer("c"),
	}
	return &Room{
		RoomId:     "ROOM",
		Players:    players,
		Phase:      PhaseVoting,
		Imposter:   imposterIdx,
		SecretWord: "elephant",
		Votes:      map[string]string{},
		Scores:     map[string]int{"a": 0, "b": 0, "c": 0},
	}
}

func TestFinalizeGameLocked_ImposterCaught(t *testing.T) {
	r := newFinalizableRoom(1) // "b" is the imposter
	r.Votes = map[string]string{
		"a": "b",
		"b": "a",
		"c": "b",
	}

	payload := r.finalizeGameLocked()

	if payload["imposterWon"] != false {
		t.Errorf("imposterWon = %v, want false", payload["imposterWon"])
	}
	if r.Phase != PhaseEnded {
		t.Errorf("Phase = %q, want %q", r.Phase, PhaseEnded)
	}
	// Each artist gets +1 when the imposter is caught.
	if r.Scores["a"] != artistWinPoints || r.Scores["c"] != artistWinPoints {
		t.Errorf("artist scores = a:%d c:%d, want both %d", r.Scores["a"], r.Scores["c"], artistWinPoints)
	}
	if r.Scores["b"] != 0 {
		t.Errorf("imposter b got %d points, want 0", r.Scores["b"])
	}
}

func TestFinalizeGameLocked_TieIsImposterEscape(t *testing.T) {
	r := newFinalizableRoom(2) // "c" is the imposter
	// Three-way tie (a:1, b:1, c:1) — artists didn't agree on a suspect.
	r.Votes = map[string]string{
		"a": "b",
		"b": "c",
		"c": "a",
	}

	payload := r.finalizeGameLocked()

	if payload["imposterWon"] != true {
		t.Errorf("imposterWon = %v, want true (tie = escape)", payload["imposterWon"])
	}
	if r.Scores["c"] != imposterWinPoints {
		t.Errorf("imposter c scored %d, want %d", r.Scores["c"], imposterWinPoints)
	}
}

func TestFinalizeGameLocked_WrongGuessIsEscape(t *testing.T) {
	r := newFinalizableRoom(2) // "c" is the imposter
	r.Votes = map[string]string{
		"a": "b",
		"b": "a",
		"c": "b",
	}
	// Tally: b:2, a:1 — clear majority is "b", but "b" isn't the imposter.

	payload := r.finalizeGameLocked()

	if payload["imposterWon"] != true {
		t.Errorf("imposterWon = %v, want true (wrong guess)", payload["imposterWon"])
	}
	if r.Scores["c"] != imposterWinPoints {
		t.Errorf("imposter c scored %d, want %d", r.Scores["c"], imposterWinPoints)
	}
}

func TestSubmitVote_RejectsDoubleVoting(t *testing.T) {
	mgr := NewManager()
	ownerConn := newTestConn()
	p1Conn := newTestConn()
	p2Conn := newTestConn()

	owner := newTestPlayer("a")
	if _, err := mgr.CreateRoom(owner, types.GameRoomSettings{}, "ROOM", ownerConn); err != nil {
		t.Fatalf("CreateRoom: %v", err)
	}
	if _, err := mgr.JoinRoom("ROOM", newTestPlayer("b"), p1Conn); err != nil {
		t.Fatalf("JoinRoom: %v", err)
	}
	if _, err := mgr.JoinRoom("ROOM", newTestPlayer("c"), p2Conn); err != nil {
		t.Fatalf("JoinRoom: %v", err)
	}

	r := mgr.GetRoom("ROOM")
	r.mu.Lock()
	r.Phase = PhaseVoting
	r.Imposter = 1
	r.Votes = map[string]string{}
	r.mu.Unlock()

	if err := mgr.SubmitVote(ownerConn, "b"); err != nil {
		t.Fatalf("first SubmitVote: %v", err)
	}
	if err := mgr.SubmitVote(ownerConn, "c"); err != errAlreadyVoted {
		t.Errorf("second SubmitVote err = %v, want errAlreadyVoted", err)
	}
}

func TestSubmitVote_RejectsInvalidTarget(t *testing.T) {
	mgr := NewManager()
	ownerConn := newTestConn()
	owner := newTestPlayer("a")
	mgr.CreateRoom(owner, types.GameRoomSettings{}, "ROOM", ownerConn)

	r := mgr.GetRoom("ROOM")
	r.mu.Lock()
	r.Phase = PhaseVoting
	r.Votes = map[string]string{}
	r.mu.Unlock()

	if err := mgr.SubmitVote(ownerConn, "nobody"); err != errInvalidVote {
		t.Errorf("SubmitVote(unknown target) err = %v, want errInvalidVote", err)
	}
}

func TestPlayAgain_ResetsStateAndKeepsScores(t *testing.T) {
	mgr := NewManager()
	ownerConn := newTestConn()
	owner := newTestPlayer("a")
	mgr.CreateRoom(owner, types.GameRoomSettings{}, "ROOM", ownerConn)

	r := mgr.GetRoom("ROOM")
	r.mu.Lock()
	r.Phase = PhaseEnded
	r.Round = 2
	r.TurnIndex = 1
	r.Imposter = 0
	r.SecretWord = "elephant"
	r.Votes = map[string]string{"a": "a"}
	r.Scores = map[string]int{"a": 5}
	r.LastResult = &GameResult{ImposterWon: true}
	r.mu.Unlock()

	if err := mgr.PlayAgain(ownerConn); err != nil {
		t.Fatalf("PlayAgain: %v", err)
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	if r.Phase != PhaseWaiting {
		t.Errorf("Phase = %q, want %q", r.Phase, PhaseWaiting)
	}
	if r.Round != 0 || r.TurnIndex != 0 {
		t.Errorf("Round/TurnIndex = %d/%d, want 0/0", r.Round, r.TurnIndex)
	}
	if r.SecretWord != "" {
		t.Errorf("SecretWord = %q, want empty", r.SecretWord)
	}
	if len(r.Votes) != 0 {
		t.Errorf("Votes should be cleared, got %v", r.Votes)
	}
	if r.LastResult != nil {
		t.Error("LastResult should be cleared")
	}
	if r.Scores["a"] != 5 {
		t.Errorf("Scores[a] = %d, want 5 (carried across games)", r.Scores["a"])
	}
}

func TestPlayAgain_RejectsNonOwner(t *testing.T) {
	mgr := NewManager()
	ownerConn := newTestConn()
	strangerConn := newTestConn()
	mgr.CreateRoom(newTestPlayer("a"), types.GameRoomSettings{}, "ROOM", ownerConn)
	mgr.JoinRoom("ROOM", newTestPlayer("b"), strangerConn)

	r := mgr.GetRoom("ROOM")
	r.mu.Lock()
	r.Phase = PhaseEnded
	r.mu.Unlock()

	if err := mgr.PlayAgain(strangerConn); err != errNotOwner {
		t.Errorf("PlayAgain(non-owner) err = %v, want errNotOwner", err)
	}
}
