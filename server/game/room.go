package game

import (
	"errors"
	"math/rand"
	"sync"
	"time"

	"imposterArtist/types"

	"github.com/gorilla/websocket"
)

// Phase enumerates the lifecycle a room moves through from creation to a
// finished game. Transitions are always driven on the server; clients only
// learn about a phase change via a `phaseChange` broadcast.
type Phase string

const (
	PhaseWaiting    Phase = "waiting"
	PhaseInProgress Phase = "inProgress"
	PhaseVoting     Phase = "voting"
	PhaseEnded      Phase = "ended"
)

const (
	defaultTurnSeconds  = 30
	minTurnSeconds      = 5
	maxTurnSeconds      = 180
	defaultRoundsLimit  = 2
	defaultMaxPlayers   = 8
	defaultMaxImposters = 1
	minPlayers          = 2
)

// GameResult captures the outcome of a finished game so we can show a
// scoreboard on the client.
type GameResult struct {
	ImposterWon      bool           `json:"imposterWon"`
	ImposterPlayerId string         `json:"imposterPlayerId"`
	SecretWord       string         `json:"secretWord"`
	VoteTally        map[string]int `json:"voteTally"`
}

// Room is the authoritative state for a single game. All exported fields are
// safe to read once locked; the internal turnTimer/mgr are never serialized.
type Room struct {
	mu sync.Mutex

	RoomId   string
	Owner    types.Player
	Settings types.GameRoomSettings
	Players  []types.Player
	Conns    []*websocket.Conn
	Colors   []string

	Phase         Phase
	Round         int
	TurnIndex     int
	Imposter      int
	SecretWord    string
	TurnStartedAt time.Time
	Votes         map[string]string
	Scores        map[string]int
	LastResult    *GameResult

	turnTimer *time.Timer
	mgr       *Manager
}

func newRoom(owner types.Player, roomId string, settings types.GameRoomSettings, mgr *Manager) *Room {
	return &Room{
		RoomId:   roomId,
		Owner:    owner,
		Settings: normalizeSettings(settings),
		Players:  []types.Player{owner},
		Conns:    nil,
		Phase:    PhaseWaiting,
		Scores:   map[string]int{},
		mgr:      mgr,
	}
}

// normalizeSettings clamps user-supplied settings into sane ranges so a
// malicious client can't brick a room with 0-second turns or 10,000 rounds.
func normalizeSettings(s types.GameRoomSettings) types.GameRoomSettings {
	if s.MaxPlayersInRoom <= 1 {
		s.MaxPlayersInRoom = defaultMaxPlayers
	}
	if s.MaxPlayersInRoom > 12 {
		s.MaxPlayersInRoom = 12
	}
	if s.MaxImpostersInRoom <= 0 {
		s.MaxImpostersInRoom = defaultMaxImposters
	}
	if s.DrawingTime < minTurnSeconds {
		s.DrawingTime = defaultTurnSeconds
	}
	if s.DrawingTime > maxTurnSeconds {
		s.DrawingTime = maxTurnSeconds
	}
	if s.DrawingRoundsLimit <= 0 {
		s.DrawingRoundsLimit = defaultRoundsLimit
	}
	if s.DrawingRoundsLimit > 10 {
		s.DrawingRoundsLimit = 10
	}
	if s.VotingType == "" {
		s.VotingType = "once"
	}
	if s.RoomType == "" {
		s.RoomType = "private"
	}
	if s.Language == "" {
		s.Language = "en"
	}
	return s
}

func (r *Room) snapshotLocked() types.GameRoom {
	players := append([]types.Player(nil), r.Players...)
	colors := append([]string(nil), r.Colors...)
	scores := make(map[string]int, len(r.Scores))
	for k, v := range r.Scores {
		scores[k] = v
	}
	return types.GameRoom{
		RoomId:        r.RoomId,
		RoomOwner:     r.Owner,
		Settings:      r.Settings,
		PlayersInRoom: players,
		GameState:     string(r.Phase),
		PlayerColors:  colors,
		Round:         r.Round,
		TotalRounds:   r.Settings.DrawingRoundsLimit,
		TurnIndex:     r.TurnIndex,
		Scores:        scores,
	}
}

// Snapshot returns a broadcast-safe copy of the room's public view.
func (r *Room) Snapshot() types.GameRoom {
	r.mu.Lock()
	defer r.mu.Unlock()
	return r.snapshotLocked()
}

// OtherConns returns a snapshot of every connection in the room except
// `skip`, safe to iterate without holding the room lock.
func (r *Room) OtherConns(skip *websocket.Conn) []*websocket.Conn {
	r.mu.Lock()
	defer r.mu.Unlock()
	out := make([]*websocket.Conn, 0, len(r.Conns))
	for _, c := range r.Conns {
		if c != nil && c != skip {
			out = append(out, c)
		}
	}
	return out
}

// AllConns returns every connection in the room.
func (r *Room) AllConns() []*websocket.Conn {
	r.mu.Lock()
	defer r.mu.Unlock()
	out := make([]*websocket.Conn, 0, len(r.Conns))
	for _, c := range r.Conns {
		if c != nil {
			out = append(out, c)
		}
	}
	return out
}

// playerIndexByConn returns the index into r.Players for the player owning
// `conn`, or -1 when the connection belongs to a spectator/ghost.
func (r *Room) playerIndexByConn(conn *websocket.Conn) int {
	for i, c := range r.Conns {
		if c == conn {
			return i
		}
	}
	return -1
}

func (r *Room) playerIndexById(id string) int {
	for i, p := range r.Players {
		if p.Id == id {
			return i
		}
	}
	return -1
}

// isOwnerConn returns true if the calling connection owns the room.
func (r *Room) isOwnerConn(conn *websocket.Conn) bool {
	idx := r.playerIndexByConn(conn)
	if idx < 0 {
		return false
	}
	return r.Players[idx].Id == r.Owner.Id
}

// ensureConnForPlayer idempotently registers the websocket for `playerId`,
// replacing any previous conn for that player (e.g. after a reconnect).
func (r *Room) ensureConnForPlayer(playerId string, conn *websocket.Conn) {
	if len(r.Conns) < len(r.Players) {
		// pad
		for len(r.Conns) < len(r.Players) {
			r.Conns = append(r.Conns, nil)
		}
	}
	idx := r.playerIndexById(playerId)
	if idx < 0 {
		return
	}
	r.Conns[idx] = conn
}

// assignRolesLocked picks an imposter, a secret word, and resets per-round
// bookkeeping. Caller holds r.mu.
func (r *Room) assignRolesLocked() {
	r.Imposter = rand.Intn(len(r.Players))
	r.SecretWord = RandomWord(r.Settings.Language)
	r.Round = 1
	r.TurnIndex = 0
	r.Votes = map[string]string{}
	r.LastResult = nil
	if r.Scores == nil {
		r.Scores = map[string]int{}
	}
	for _, p := range r.Players {
		if _, ok := r.Scores[p.Id]; !ok {
			r.Scores[p.Id] = 0
		}
	}
}

// roleMessageFor returns the private payload to send to a single player at
// the start of a game: whether they are the imposter and — for artists — the
// word.
func (r *Room) roleMessageFor(idx int) map[string]interface{} {
	isImposter := idx == r.Imposter
	payload := map[string]interface{}{
		"success":    true,
		"isImposter": isImposter,
		"roomId":     r.RoomId,
	}
	if !isImposter {
		payload["word"] = r.SecretWord
	}
	return payload
}

var (
	errRoomFull       = errors.New("room is full")
	errRoomInProgress = errors.New("game is already in progress")
	errUnknownRoom    = errors.New("room does not exist")
	errRoomExists     = errors.New("a room with that code already exists")
	errNotOwner       = errors.New("only the room owner can do that")
	errNotYourTurn    = errors.New("it is not your turn")
	errWrongPhase     = errors.New("action not available in the current phase")
	errInvalidVote    = errors.New("invalid vote")
	errNotInRoom      = errors.New("you are not in this room")
	errTooFewPlayers  = errors.New("need at least 2 players to start")
	errAlreadyVoted   = errors.New("you have already voted")
)
