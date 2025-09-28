package ws

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"nhooyr.io/websocket"

	"github.com/codeadventurers/api-go/internal/ws"
)

// Handler manages websocket connections for run streams.
type Handler struct {
	manager *ws.Manager
}

// New creates a websocket handler.
func New(manager *ws.Manager) *Handler {
	return &Handler{manager: manager}
}

// Stream upgrades the connection and registers it with the manager.
func (h *Handler) Stream(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		userID = c.Query("userId")
	}
	conn, err := websocket.Accept(c.Writer, c.Request, &websocket.AcceptOptions{
		InsecureSkipVerify: true,
	})
	if err != nil {
		c.Status(http.StatusBadRequest)
		return
	}
	defer conn.Close(websocket.StatusNormalClosure, "closing")

	h.manager.Register(userID, conn)

	for {
		_, _, err := conn.Read(c.Request.Context())
		if err != nil {
			h.manager.Cleanup(userID, conn)
			return
		}
		time.Sleep(time.Second)
	}
}
