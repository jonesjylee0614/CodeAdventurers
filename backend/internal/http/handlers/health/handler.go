package health

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	service "github.com/codeadventurers/api-go/internal/service/health"
)

// Handler exposes liveness and readiness endpoints.
type Handler struct {
	service *service.Service
	log     *zap.Logger
}

// New creates a health handler instance.
func New(service *service.Service, log *zap.Logger) *Handler {
	return &Handler{service: service, log: log}
}

// Liveness responds with basic status information.
func (h *Handler) Liveness(c *gin.Context) {
	payload := h.service.Liveness(c.Request.Context())
	h.log.Debug("liveness probe served", zap.Any("payload", payload))
	c.JSON(http.StatusOK, payload)
}

// Readiness responds with dependency health.
func (h *Handler) Readiness(c *gin.Context) {
	payload := h.service.Readiness(c.Request.Context())
	h.log.Info("readiness probe served", zap.Any("payload", payload))
	c.JSON(http.StatusOK, payload)
}
