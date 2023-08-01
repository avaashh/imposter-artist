package serverhandlers

import (
	"encoding/json"
	"math/rand"

	"imposterArtist/database"
	"imposterArtist/types"

	"github.com/gorilla/websocket"
)

func HandleCreateAGame(
	payloadBytes []byte,
	response map[string]interface{},
	res types.Response,
	conn *websocket.Conn,
) types.Response {

	// Create a Game, payload should be interface GameRoom

	var gameRoom types.GameRoom

	err := json.Unmarshal(payloadBytes, &gameRoom)
	if err != nil {
		response["err"] = "Could not understand request"
		return res
	}

	gameRoom.PlayersConn = append(gameRoom.PlayersConn, conn)
	if !database.Store("gamerooms", gameRoom.RoomId, gameRoom, false) {
		response["err"] = "Game already exists"
		return res
	}

	secrets := types.ActiveGameRoomSecrets{
		RoomId: gameRoom.RoomId,
		Imposter: rand.Intn(len(gameRoom.PlayersInRoom)),
		SecretWord: database.GetWordForRound(),
		CurrentTurn: 0,
	}

	if !database.Store("gameroomSecrets", secrets.RoomId, secrets, false) {
		response["err"] = "Game already exists"
		return res
	}

	response["success"] = true
	response["gameRoom"] = gameRoom

	return res
}