package ws

import (
	"context"
	"sync"

	"nhooyr.io/websocket"
)

// Manager keeps track of WebSocket connections per user.
type Manager struct {
	mu          sync.RWMutex
	connections map[string][]*websocket.Conn
}

// NewManager creates a new WebSocket manager instance.
func NewManager() *Manager {
	return &Manager{connections: make(map[string][]*websocket.Conn)}
}

// Register adds a connection for the given user ID.
func (m *Manager) Register(userID string, conn *websocket.Conn) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.connections[userID] = append(m.connections[userID], conn)
}

// Broadcast sends a payload to all connections for the given user.
func (m *Manager) Broadcast(ctx context.Context, userID string, payload []byte) error {
	m.mu.RLock()
	conns := append([]*websocket.Conn(nil), m.connections[userID]...)
	m.mu.RUnlock()
	var firstErr error
	for _, conn := range conns {
		if err := conn.Write(ctx, websocket.MessageText, payload); err != nil && firstErr == nil {
			firstErr = err
		}
	}
	return firstErr
}

// Cleanup removes closed connections.
func (m *Manager) Cleanup(userID string, conn *websocket.Conn) {
	m.mu.Lock()
	defer m.mu.Unlock()
	connections := m.connections[userID]
	for i, existing := range connections {
		if existing == conn {
			connections = append(connections[:i], connections[i+1:]...)
			break
		}
	}
	if len(connections) == 0 {
		delete(m.connections, userID)
		return
	}
	m.connections[userID] = connections
}
