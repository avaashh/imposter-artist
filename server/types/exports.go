package types

import "github.com/gorilla/websocket"

type Request struct {
	ID      string      `json:"id,omitempty"`
	Type    string      `json:"type,omitempty"`
	Payload interface{} `json:"payload,omitempty"`
}

type Response struct {
	ID      string      `json:"id,omitempty"`
	Type    string      `json:"type,omitempty"`
	Payload interface{} `json:"payload,omitempty"`
}

type Player struct {
	Id         string    `json:"id,omitempty"`
	PlayerName string    `json:"playerName,omitempty"`
	Character  Character `json:"character"`
}

type Character struct {
	CharacterIdentity string `json:"characterIdentity"`
	CharacterColor    string `json:"characterColor"`
}

// GameRoom is the broadcast-safe view of a room. Internal state used by
// the game-state machine (timers, imposter index, secret word, votes) is
// kept in the `game.Room` struct and never marshalled.
type GameRoom struct {
	RoomId        string           `json:"roomId,omitempty"`
	RoomOwner     Player           `json:"roomOwner"`
	Settings      GameRoomSettings `json:"settings"`
	PlayersInRoom []Player         `json:"playersInRoom"`
	GameState     string           `json:"gameState,omitempty"`
	PlayerColors  []string         `json:"playerColors,omitempty"`

	Round       int            `json:"round,omitempty"`
	TotalRounds int            `json:"totalRounds,omitempty"`
	TurnIndex   int            `json:"turnIndex"`
	Scores      map[string]int `json:"scores,omitempty"`

	// PlayersConn is kept on the wire-adjacent struct purely for
	// historical reasons; it is json-ignored and only populated by the
	// legacy handlers. New code should use game.Room.Conns instead.
	PlayersConn []*websocket.Conn `json:"-"`
}

type GameRoomSettings struct {
	MaxPlayersInRoom   int    `json:"maxPlayersInRoom,omitempty"`
	MaxImpostersInRoom int    `json:"maxImpostersInRoom,omitempty"`
	Language           string `json:"language,omitempty"`
	DrawingTime        int    `json:"drawingTime,omitempty"`
	Rounds             int    `json:"rounds,omitempty"`
	DrawingRoundsLimit int    `json:"drawingRoundsLimit,omitempty"`
	VotingType         string `json:"votingType,omitempty"`
	RoomType           string `json:"roomType,omitempty"`
}

type Point struct {
	X     float64 `json:"x"`
	Y     float64 `json:"y"`
	Color string  `json:"color,omitempty"`
}

type Stroke = []Point

type DrawnStroke struct {
	PlayerId string `json:"playerId"`
	Stroke   Stroke `json:"stroke"`
}

const ServerPort = "8000"
