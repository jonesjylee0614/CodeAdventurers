package teacher

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	service "github.com/codeadventurers/api-go/internal/service/teacher"
)

// Handler exposes analytics endpoints for teachers.
type Handler struct {
	service *service.Service
	log     *zap.Logger
}

// New creates the teacher handler.
func New(service *service.Service, log *zap.Logger) *Handler {
	return &Handler{service: service, log: log}
}

// Analytics returns aggregated data for the requested resource path.
func (h *Handler) Analytics(c *gin.Context) {
	resource := c.Param("resource")
	query := map[string]string{}
	for key, values := range c.Request.URL.Query() {
		if len(values) > 0 {
			query[key] = values[0]
		}
	}
	h.log.Info("teacher analytics requested", zap.String("resource", resource), zap.Int("query_params", len(query)))
	payload, err := h.service.Analytics(c.Request.Context(), resource, query)
	if err != nil {
		h.log.Error("teacher analytics failed", zap.String("resource", resource), zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	h.log.Info("teacher analytics succeeded", zap.String("resource", resource))
	c.JSON(http.StatusOK, payload)
}
