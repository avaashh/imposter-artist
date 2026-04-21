package game

import (
	"log"
	"sync"

	"imposterArtist/types"

	"github.com/gorilla/websocket"
)

// Default is the process-wide room registry. A Manager is cheap to construct
// if tests want an isolated one.
var Default = NewManager()

type connAssoc struct {
	roomId   string
	playerId string
}

// Manager owns the map of active rooms and a reverse-index from websocket
// connections to the (room, player) pair they belong to. The reverse index
// is what lets the disconnect path clean up after a closed socket without
// scanning every room.
type Manager struct {
	mu    sync.RWMutex
	rooms map[string]*Room
	index map[*websocket.Conn]connAssoc
}

func NewManager() *Manager {
	return &Manager{
		rooms: map[string]*Room{},
		index: map[*websocket.Conn]connAssoc{},
	}
}

// CreateRoom registers a new room owned by `owner` using connection `conn`.
// Returns the freshly-created room.
func (m *Manager) CreateRoom(owner types.Player, settings types.GameRoomSettings, roomId string, conn *websocket.Conn) (*Room, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.rooms[roomId]; exists {
		return nil, errRoomExists
	}
	r := newRoom(owner, roomId, settings, m)
	r.Conns = []*websocket.Conn{conn}
	m.rooms[roomId] = r
	m.index[conn] = connAssoc{roomId: roomId, playerId: owner.Id}
	log.Printf("[room] created roomId=%s owner=%s conn=%p", roomId, owner.Id, conn)
	return r, nil
}

// JoinRoom adds player `p` to the named room and registers the connection.
// Returns the updated room snapshot-ready pointer on success.
func (m *Manager) JoinRoom(roomId string, p types.Player, conn *websocket.Conn) (*Room, error) {
	m.mu.Lock()
	r, ok := m.rooms[roomId]
	m.mu.Unlock()
	if !ok {
		return nil, errUnknownRoom
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	if r.Phase != PhaseWaiting {
		return nil, errRoomInProgress
	}
	if len(r.Players) >= r.Settings.MaxPlayersInRoom {
		return nil, errRoomFull
	}
	for i, existing := range r.Players {
		if existing.Id == p.Id {
			// Reconnect: refresh the conn slot, don't duplicate.
			for len(r.Conns) <= i {
				r.Conns = append(r.Conns, nil)
			}
			r.Conns[i] = conn
			m.mu.Lock()
			m.index[conn] = connAssoc{roomId: roomId, playerId: p.Id}
			m.mu.Unlock()
			log.Printf("[room] reconnect roomId=%s player=%s conn=%p", roomId, p.Id, conn)
			return r, nil
		}
	}

	r.Players = append(r.Players, p)
	r.Conns = append(r.Conns, conn)
	m.mu.Lock()
	m.index[conn] = connAssoc{roomId: roomId, playerId: p.Id}
	m.mu.Unlock()
	log.Printf("[room] joined roomId=%s player=%s count=%d conn=%p", roomId, p.Id, len(r.Players), conn)
	return r, nil
}

// FindByConn returns the room a connection is associated with, plus the
// player's id. Returns nil if the connection isn't registered.
func (m *Manager) FindByConn(conn *websocket.Conn) (*Room, string) {
	m.mu.RLock()
	assoc, ok := m.index[conn]
	m.mu.RUnlock()
	if !ok {
		return nil, ""
	}
	m.mu.RLock()
	r := m.rooms[assoc.roomId]
	m.mu.RUnlock()
	return r, assoc.playerId
}

// GetRoom returns the room with the given id, or nil when missing.
func (m *Manager) GetRoom(roomId string) *Room {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.rooms[roomId]
}

// removeRoom drops a room from the registry. Caller must not hold room lock.
func (m *Manager) removeRoom(roomId string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if _, existed := m.rooms[roomId]; existed {
		log.Printf("[room] closed roomId=%s", roomId)
	}
	delete(m.rooms, roomId)
}

// dropConnIndex removes the reverse index entry for a given conn.
func (m *Manager) dropConnIndex(conn *websocket.Conn) {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.index, conn)
}
