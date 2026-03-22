package dist

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"

	"imposterArtist/game"
	"imposterArtist/types"
	"imposterArtist/web"

	"github.com/gorilla/websocket"
)

// AppServer starts the HTTP + WebSocket server. Blocking; exits the process
// on a fatal listen error.
func AppServer() {
	http.HandleFunc("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})
	http.HandleFunc("/ws", handleWebSocket)
	fmt.Println("Webserver started on port", types.ServerPort)

	if err := http.ListenAndServe(":"+types.ServerPort, nil); err != nil {
		log.Fatal(err)
	}
}

// errResponse builds the canonical shape for failure payloads so the client
// can display a toast without having to guess fields.
func errResponse(req types.Request, err error) types.Response {
	return types.Response{
		ID:   req.ID,
		Type: req.Type,
		Payload: map[string]interface{}{
			"success": false,
			"err":     err.Error(),
		},
	}
}

func okResponse(req types.Request, payload map[string]interface{}) types.Response {
	if payload == nil {
		payload = map[string]interface{}{}
	}
	payload["success"] = true
	return types.Response{
		ID:      req.ID,
		Type:    req.Type,
		Payload: payload,
	}
}

func handleIncomingRequest(req types.Request, conn *websocket.Conn, messageType int) types.Response {
	payload, ok := req.Payload.(map[string]interface{})
	if !ok && req.Type != web.ActionCreateGame {
		return errResponse(req, errors.New("could not understand payload"))
	}

	switch req.Type {
	case web.ActionCreateGame:
		return handleCreate(req, conn)
	case web.ActionJoinGameWithCode:
		return handleJoin(req, payload, conn)
	case web.ActionStartGame:
		return handleStart(req, conn)
	case web.ActionSendStroke:
		return handleStroke(req, payload, conn, messageType)
	case web.ActionLeaveGame:
		return handleLeave(req, conn)
	case web.ActionEndTurn:
		return handleEndTurn(req, conn)
	case web.ActionSendVote:
		return handleVote(req, payload, conn)
	case web.ActionPlayAgain:
		return handlePlayAgain(req, conn)
	case web.ActionUpdateGameSettings:
		return handleUpdateSettings(req, payload, conn)
	default:
		return errResponse(req, fmt.Errorf("unknown action: %s", req.Type))
	}
}

func handleCreate(req types.Request, conn *websocket.Conn) types.Response {
	raw, err := json.Marshal(req.Payload)
	if err != nil {
		return errResponse(req, errors.New("could not understand request"))
	}
	var incoming types.GameRoom
	if err := json.Unmarshal(raw, &incoming); err != nil {
		return errResponse(req, errors.New("could not understand request"))
	}
	if incoming.RoomId == "" || incoming.RoomOwner.Id == "" {
		return errResponse(req, errors.New("roomId and owner are required"))
	}

	r, err := game.Default.CreateRoom(incoming.RoomOwner, incoming.Settings, incoming.RoomId, conn)
	if err != nil {
		return errResponse(req, err)
	}
	snap := r.Snapshot()
	return okResponse(req, map[string]interface{}{
		"gameRoom": snap,
	})
}

func handleJoin(req types.Request, payload map[string]interface{}, conn *websocket.Conn) types.Response {
	roomId, _ := payload["gameRoomId"].(string)
	if roomId == "" {
		return errResponse(req, errors.New("missing room code"))
	}
	rawPlayer, err := json.Marshal(payload["player"])
	if err != nil {
		return errResponse(req, errors.New("could not understand player"))
	}
	var p types.Player
	if err := json.Unmarshal(rawPlayer, &p); err != nil || p.Id == "" {
		return errResponse(req, errors.New("could not understand player"))
	}

	r, err := game.Default.JoinRoom(roomId, p, conn)
	if err != nil {
		return errResponse(req, err)
	}
	snap := r.Snapshot()

	// Fan out a playerJoined event to everyone already in the room so their
	// lobbies update in real time.
	othersConns := r.OtherConns(conn)
	for _, c := range othersConns {
		msg := types.Response{
			Type: "playerJoinedGame",
			Payload: map[string]interface{}{
				"success":  true,
				"roomId":   snap.RoomId,
				"player":   p,
				"gameRoom": snap,
			},
		}
		data, _ := json.Marshal(msg)
		_ = c.WriteMessage(websocket.TextMessage, data)
	}

	return okResponse(req, map[string]interface{}{
		"gameRoom": snap,
		"player":   p,
	})
}

func handleStart(req types.Request, conn *websocket.Conn) types.Response {
	if err := game.Default.StartGame(conn); err != nil {
		return errResponse(req, err)
	}
	return okResponse(req, nil)
}

func handleStroke(req types.Request, payload map[string]interface{}, conn *websocket.Conn, _ int) types.Response {
	strokeData, ok := payload["stroke"].([]interface{})
	if !ok {
		return errResponse(req, errors.New("could not understand stroke"))
	}
	stroke, err := parseStroke(strokeData)
	if err != nil {
		return errResponse(req, err)
	}

	if err := game.Default.AcceptStroke(conn, stroke); err != nil {
		return errResponse(req, err)
	}
	return okResponse(req, nil)
}

func handleLeave(req types.Request, conn *websocket.Conn) types.Response {
	game.Default.LeavePlayerByConn(conn)
	return okResponse(req, nil)
}

func handleEndTurn(req types.Request, conn *websocket.Conn) types.Response {
	if err := game.Default.EndTurnByConn(conn); err != nil {
		return errResponse(req, err)
	}
	return okResponse(req, nil)
}

func handleVote(req types.Request, payload map[string]interface{}, conn *websocket.Conn) types.Response {
	target, _ := payload["votedPlayerId"].(string)
	if target == "" {
		return errResponse(req, errors.New("missing votedPlayerId"))
	}
	if err := game.Default.SubmitVote(conn, target); err != nil {
		return errResponse(req, err)
	}
	return okResponse(req, nil)
}

func handlePlayAgain(req types.Request, conn *websocket.Conn) types.Response {
	if err := game.Default.PlayAgain(conn); err != nil {
		return errResponse(req, err)
	}
	return okResponse(req, nil)
}

func handleUpdateSettings(req types.Request, payload map[string]interface{}, conn *websocket.Conn) types.Response {
	raw, err := json.Marshal(payload["settings"])
	if err != nil {
		return errResponse(req, errors.New("could not understand settings"))
	}
	var s types.GameRoomSettings
	if err := json.Unmarshal(raw, &s); err != nil {
		return errResponse(req, errors.New("could not understand settings"))
	}
	if err := game.Default.UpdateSettings(conn, s); err != nil {
		return errResponse(req, err)
	}
	return okResponse(req, nil)
}

func parseStroke(raw []interface{}) (types.Stroke, error) {
	stroke := make(types.Stroke, 0, len(raw))
	for _, pointData := range raw {
		pointMap, ok := pointData.(map[string]interface{})
		if !ok {
			return nil, errors.New("invalid stroke data format")
		}
		x, xOk := pointMap["x"].(float64)
		y, yOk := pointMap["y"].(float64)
		color, colorOk := pointMap["color"].(string)
		if !xOk || !yOk || !colorOk {
			return nil, errors.New("invalid stroke data format")
		}
		stroke = append(stroke, types.Point{X: x, Y: y, Color: color})
	}
	return stroke, nil
}
