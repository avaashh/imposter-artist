package types

import "github.com/gorilla/websocket"

type Request struct {
	ID		string		`json:"id,omitempty"`
    Type    string      `json:"type,omitempty"`
	Payload interface{} `json:"payload,omitempty"`
}

type Response struct {
	ID		string		`json:"id,omitempty"`
    Type    string      `json:"type,omitempty"`
	Payload interface{} `json:"payload,omitempty"`
}

type Player struct {
	Id   		string 		`json:"id,omitempty"` // Unique ID of the Player
	PlayerName 	string 		`json:"playerName,omitempty"` // Name of the Player
	Character 	Character 	`json:"character"`
  }

type Character struct {
	CharacterIdentity 	string 	`json:"characterIdentity"` // Identity of the character's svg
	CharacterColor 		string 	`json:"characterColor"` // Color of the character (in hex format)
  }

type GameRoom struct {
	RoomId			string 				`json:"roomId,omitempty"` // Unique ID of the room
	RoomOwner 		Player				`json:"roomOwner,omitempty"` // User who owns the room
	Settings 		GameRoomSettings 	`json:"settings,omitempty"`// Settings of the game room
	PlayersInRoom 	[]Player			`json:"playersInRoom,omitempty"` // Array of users currently in the room
	GameState	 	string				`json:"gameState,omitempty"`
	PlayersConn		[]*websocket.Conn
	PlayerColors 	[]string
  }

type GameRoomSettings struct {
	MaxPlayersInRoom 	int 	`json:"maxPlayersInRoom,omitempty"` // Maximum number of players allowed in the room
	MaxImpostersInRoom	int 	`json:"maxImpostersInRoom,omitempty"` // Maximum number of imposters allowed in the room
	Language 			string 	`json:"language,omitempty"` // Language setting for the room
	DrawingTime 		int 	`json:"drawingTime,omitempty"` // Time limit for drawing in the room in seconds
	Rounds 				int 	`json:"rounds,omitempty"` // Number of rounds of games with different phrases
	DrawingRoundsLimit 	int 	`json:"drawingRoundsLimit,omitempty"` // Number of rounds in the game after which voting is enabled
	VotingType 			string 	`json:"votingType,omitempty"`
	RoomType 			string 	`json:"roomType,omitempty"` // Type of the room (public or private)
}

type ActiveGameRoomSecrets struct {
	Imposter 	int
	SecretWord	int
	CurrentTurn	int
}

type Point struct  {
	X 		float64 `json:"x,omitempty"`
	Y		float64	`json:"y,omitempty"`
	Color 	string 	`json:"color,omitempty"`
}

type Stroke = []Point

const ServerPort = "8000"