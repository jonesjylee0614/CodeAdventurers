package student

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"

	"github.com/codeadventurers/api-go/internal/http/dto"
	"github.com/codeadventurers/api-go/internal/jobs"
	service "github.com/codeadventurers/api-go/internal/service/student"
)

// Handler wires student related endpoints.
type Handler struct {
	service  *service.Service
	jobs     *jobs.Dispatcher
	validate *validator.Validate
}

// New creates the student handler.
func New(service *service.Service, jobs *jobs.Dispatcher, validate *validator.Validate) *Handler {
	return &Handler{service: service, jobs: jobs, validate: validate}
}

// Map returns the overall map for the student.
func (h *Handler) Map(c *gin.Context) {
	result, err := h.service.Map(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"levels": result.Levels})
}

// Prep returns the preparation payload for a given level.
func (h *Handler) Prep(c *gin.Context) {
	levelID := c.Param("id")
	result, err := h.service.Prep(c.Request.Context(), levelID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}

// Run executes a level or dispatches it to the async worker depending on internal heuristics.
func (h *Handler) Run(c *gin.Context) {
	levelID := c.Param("id")
	var req dto.LevelRunRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.respondValidationError(c, err)
		return
	}
	if err := h.validate.Struct(req); err != nil {
		h.respondValidationError(c, err)
		return
	}
	result, err := h.service.Run(c.Request.Context(), levelID, service.RunRequest{Code: req.Code, Language: req.Language})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if result.Mode == service.ModeAsync {
		taskID, err := h.jobs.EnqueueRunTask(c.Request.Context(), gin.H{"levelId": levelID, "code": req.Code, "language": req.Language})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusAccepted, dto.LevelRunResponse{TaskID: taskID, Status: string(service.ModeAsync)})
		return
	}
	c.JSON(http.StatusOK, dto.LevelRunResponse{Status: string(service.ModeSync), Output: result.Output})
}

// Complete marks the level as completed.
func (h *Handler) Complete(c *gin.Context) {
	levelID := c.Param("id")
	var req dto.LevelCompleteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.respondValidationError(c, err)
		return
	}
	if err := h.validate.Struct(req); err != nil {
		h.respondValidationError(c, err)
		return
	}
	if err := h.service.Complete(c.Request.Context(), levelID, service.CompleteRequest{Score: req.Score, CompletedAt: req.CompletedAt}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// Sandbox executes code in sandbox mode.
func (h *Handler) Sandbox(c *gin.Context) {
	levelID := c.Param("id")
	var req dto.SandboxRunRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.respondValidationError(c, err)
		return
	}
	if err := h.validate.Struct(req); err != nil {
		h.respondValidationError(c, err)
		return
	}
	result, err := h.service.Sandbox(c.Request.Context(), levelID, service.SandboxRequest{Code: req.Code, Language: req.Language})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.LevelRunResponse{Status: string(result.Mode), Output: result.Output})
}

func (h *Handler) respondValidationError(c *gin.Context, err error) {
	c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
}
