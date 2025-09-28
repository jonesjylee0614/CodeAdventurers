package teacher

import (
	"net/http"

	"github.com/gin-gonic/gin"

	service "github.com/codeadventurers/api-go/internal/service/teacher"
)

// Handler exposes analytics endpoints for teachers.
type Handler struct {
	service *service.Service
}

// New creates the teacher handler.
func New(service *service.Service) *Handler {
	return &Handler{service: service}
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
	payload, err := h.service.Analytics(c.Request.Context(), resource, query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, payload)
}
