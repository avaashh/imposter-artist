package game

import (
	"testing"

	"imposterArtist/types"

	"github.com/gorilla/websocket"
)

func TestNormalizeSettings_DefaultsWhenZero(t *testing.T) {
	got := normalizeSettings(types.GameRoomSettings{})
	if got.MaxPlayersInRoom != defaultMaxPlayers {
		t.Errorf("MaxPlayersInRoom = %d, want %d", got.MaxPlayersInRoom, defaultMaxPlayers)
	}
	if got.MaxImpostersInRoom != defaultMaxImposters {
		t.Errorf("MaxImpostersInRoom = %d, want %d", got.MaxImpostersInRoom, defaultMaxImposters)
	}
	if got.DrawingTime != defaultTurnSeconds {
		t.Errorf("DrawingTime = %d, want %d", got.DrawingTime, defaultTurnSeconds)
	}
	if got.DrawingRoundsLimit != defaultRoundsLimit {
		t.Errorf("DrawingRoundsLimit = %d, want %d", got.DrawingRoundsLimit, defaultRoundsLimit)
	}
	if got.VotingType != "once" {
		t.Errorf("VotingType = %q, want %q", got.VotingType, "once")
	}
	if got.RoomType != "private" {
		t.Errorf("RoomType = %q, want %q", got.RoomType, "private")
	}
	if got.Language != "en" {
		t.Errorf("Language = %q, want %q", got.Language, "en")
	}
}

func TestNormalizeSettings_ClampsHighValues(t *testing.T) {
	got := normalizeSettings(types.GameRoomSettings{
		MaxPlayersInRoom:   99,
		DrawingTime:        9999,
		DrawingRoundsLimit: 500,
	})
	if got.MaxPlayersInRoom != 12 {
		t.Errorf("MaxPlayersInRoom = %d, want 12", got.MaxPlayersInRoom)
	}
	if got.DrawingTime != maxTurnSeconds {
		t.Errorf("DrawingTime = %d, want %d", got.DrawingTime, maxTurnSeconds)
	}
	if got.DrawingRoundsLimit != 10 {
		t.Errorf("DrawingRoundsLimit = %d, want 10", got.DrawingRoundsLimit)
	}
}

func TestNormalizeSettings_ClampsLowDrawingTime(t *testing.T) {
	got := normalizeSettings(types.GameRoomSettings{DrawingTime: 1})
	if got.DrawingTime != defaultTurnSeconds {
		t.Errorf("DrawingTime = %d, want %d (default applied when below min)", got.DrawingTime, defaultTurnSeconds)
	}
}

func TestNormalizeSettings_PreservesValidValues(t *testing.T) {
	in := types.GameRoomSettings{
		MaxPlayersInRoom:   6,
		MaxImpostersInRoom: 1,
		DrawingTime:        45,
		DrawingRoundsLimit: 3,
		VotingType:         "continued",
		RoomType:           "public",
		Language:           "en",
	}
	got := normalizeSettings(in)
	if got != in {
		t.Errorf("settings mutated when all values were valid: got %+v, want %+v", got, in)
	}
}

func TestRemovePlayerAtLocked_ShiftsPlayersAndConns(t *testing.T) {
	r := &Room{
		Players: []types.Player{newTestPlayer("a"), newTestPlayer("b"), newTestPlayer("c")},
		Conns:   []*websocket.Conn{newTestConn(), newTestConn(), newTestConn()},
		Colors:  []string{"red", "green", "blue"},
	}
	origB := r.Conns[1]
	origC := r.Conns[2]

	r.removePlayerAtLocked(0)

	if len(r.Players) != 2 {
		t.Fatalf("Players len = %d, want 2", len(r.Players))
	}
	if r.Players[0].Id != "b" || r.Players[1].Id != "c" {
		t.Errorf("Players = %v, want [b, c]", r.Players)
	}
	if r.Conns[0] != origB || r.Conns[1] != origC {
		t.Errorf("Conns not shifted correctly")
	}
	if r.Colors[0] != "green" || r.Colors[1] != "blue" {
		t.Errorf("Colors = %v, want [green, blue]", r.Colors)
	}
}

func TestRemovePlayerAtLocked_ImposterIndexShift(t *testing.T) {
	cases := []struct {
		name         string
		imposter     int
		removeIdx    int
		wantImposter int
	}{
		{"remove before imposter shifts down", 2, 0, 1},
		{"remove imposter marks -1", 1, 1, -1},
		{"remove after imposter unchanged", 0, 2, 0},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			r := &Room{
				Players:  []types.Player{newTestPlayer("a"), newTestPlayer("b"), newTestPlayer("c")},
				Imposter: c.imposter,
			}
			r.removePlayerAtLocked(c.removeIdx)
			if r.Imposter != c.wantImposter {
				t.Errorf("Imposter = %d, want %d", r.Imposter, c.wantImposter)
			}
		})
	}
}

func TestRemovePlayerAtLocked_TurnIndexShift(t *testing.T) {
	cases := []struct {
		name          string
		turnIndex     int
		removeIdx     int
		wantTurnIndex int
	}{
		{"remove before current drawer shifts down", 2, 0, 1},
		{"remove current drawer keeps index (next turn logic handles it)", 1, 1, 1},
		{"remove after current drawer unchanged", 0, 2, 0},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			r := &Room{
				Players:   []types.Player{newTestPlayer("a"), newTestPlayer("b"), newTestPlayer("c")},
				TurnIndex: c.turnIndex,
			}
			r.removePlayerAtLocked(c.removeIdx)
			if r.TurnIndex != c.wantTurnIndex {
				t.Errorf("TurnIndex = %d, want %d", r.TurnIndex, c.wantTurnIndex)
			}
		})
	}
}

func TestRemovePlayerAtLocked_OutOfRangeIsNoop(t *testing.T) {
	r := &Room{Players: []types.Player{newTestPlayer("a")}}
	r.removePlayerAtLocked(5)
	r.removePlayerAtLocked(-1)
	if len(r.Players) != 1 {
		t.Errorf("expected no-op, got Players len = %d", len(r.Players))
	}
}
