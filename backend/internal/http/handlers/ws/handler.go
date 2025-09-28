package ws

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"nhooyr.io/websocket"

	"github.com/codeadventurers/api-go/internal/ws"
)

// Handler manages websocket connections for run streams.
type Handler struct {
	manager *ws.Manager
	log     *zap.Logger
}

// New creates a websocket handler.
func New(manager *ws.Manager, log *zap.Logger) *Handler {
	return &Handler{manager: manager, log: log}
}

// Stream upgrades the connection and registers it with the manager.
func (h *Handler) Stream(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		userID = c.Query("userId")
	}
	if userID == "" {
		h.log.Warn("websocket stream missing user id", zap.String("path", c.FullPath()))
	}
	conn, err := websocket.Accept(c.Writer, c.Request, &websocket.AcceptOptions{
		InsecureSkipVerify: true,
	})
	if err != nil {
		h.log.Error("websocket accept failed", zap.Error(err))
		c.Status(http.StatusBadRequest)
		return
	}
	defer conn.Close(websocket.StatusNormalClosure, "closing")

	h.log.Info("websocket connection established", zap.String("user_id", userID))
	h.manager.Register(userID, conn)

	for {
		_, _, err := conn.Read(c.Request.Context())
		if err != nil {
			h.log.Info("websocket connection closed", zap.String("user_id", userID), zap.Error(err))
			h.manager.Cleanup(userID, conn)
			return
		}
		time.Sleep(time.Second)
	}
}
