package health

import (
	"net/http"

	"github.com/gin-gonic/gin"

	service "github.com/codeadventurers/api-go/internal/service/health"
)

// Handler exposes liveness and readiness endpoints.
type Handler struct {
	service *service.Service
}

// New creates a health handler instance.
func New(service *service.Service) *Handler {
	return &Handler{service: service}
}

// Liveness responds with basic status information.
func (h *Handler) Liveness(c *gin.Context) {
	c.JSON(http.StatusOK, h.service.Liveness(c.Request.Context()))
}

// Readiness responds with dependency health.
func (h *Handler) Readiness(c *gin.Context) {
	c.JSON(http.StatusOK, h.service.Readiness(c.Request.Context()))
}
