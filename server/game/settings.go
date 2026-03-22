package game

import (
	"imposterArtist/types"

	"github.com/gorilla/websocket"
)

// UpdateSettings lets the owner tweak lobby settings before the game
// starts. After Waiting the settings are frozen — otherwise a mid-game
// "drawingTime = 2" tweak could grief the current drawer.
func (m *Manager) UpdateSettings(conn *websocket.Conn, incoming types.GameRoomSettings) error {
	r, _ := m.FindByConn(conn)
	if r == nil {
		return errNotInRoom
	}

	r.mu.Lock()
	if !r.isOwnerConn(conn) {
		r.mu.Unlock()
		return errNotOwner
	}
	if r.Phase != PhaseWaiting {
		r.mu.Unlock()
		return errWrongPhase
	}
	r.Settings = normalizeSettings(incoming)
	normalized := r.Settings
	roomId := r.RoomId
	conns := r.connsLocked()
	r.mu.Unlock()

	sendTo(conns, types.Response{
		Type: "gameSettingsUpdated",
		Payload: map[string]interface{}{
			"success":  true,
			"roomId":   roomId,
			"settings": normalized,
		},
	})
	return nil
}
