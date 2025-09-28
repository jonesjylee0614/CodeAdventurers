package student

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"go.uber.org/zap"

	"github.com/codeadventurers/api-go/internal/http/dto"
	"github.com/codeadventurers/api-go/internal/jobs"
	service "github.com/codeadventurers/api-go/internal/service/student"
)

// Handler wires student related endpoints.
type Handler struct {
	service  *service.Service
	jobs     *jobs.Dispatcher
	validate *validator.Validate
	log      *zap.Logger
}

// New creates the student handler.
func New(service *service.Service, jobs *jobs.Dispatcher, validate *validator.Validate, log *zap.Logger) *Handler {
	return &Handler{service: service, jobs: jobs, validate: validate, log: log}
}

// Map returns the overall map for the student.
func (h *Handler) Map(c *gin.Context) {
	h.log.Info("fetching student map", zap.String("path", c.FullPath()))
	result, err := h.service.Map(c.Request.Context())
	if err != nil {
		h.log.Error("failed to fetch student map", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	h.log.Info("student map fetched", zap.Int("levels", len(result.Levels)))
	c.JSON(http.StatusOK, gin.H{"levels": result.Levels})
}

// Prep returns the preparation payload for a given level.
func (h *Handler) Prep(c *gin.Context) {
	levelID := c.Param("id")
	h.log.Info("fetching level prep", zap.String("level_id", levelID))
	result, err := h.service.Prep(c.Request.Context(), levelID)
	if err != nil {
		h.log.Error("failed to fetch level prep", zap.String("level_id", levelID), zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	h.log.Info("level prep fetched", zap.String("level_id", levelID))
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
	h.log.Info("processing level run", zap.String("level_id", levelID), zap.String("language", req.Language), zap.Int("code_len", len(req.Code)))
	result, err := h.service.Run(c.Request.Context(), levelID, service.RunRequest{Code: req.Code, Language: req.Language})
	if err != nil {
		h.log.Error("level run failed", zap.String("level_id", levelID), zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if result.Mode == service.ModeAsync {
		taskID, err := h.jobs.EnqueueRunTask(c.Request.Context(), gin.H{"levelId": levelID, "code": req.Code, "language": req.Language})
		if err != nil {
			h.log.Error("failed to enqueue async run", zap.String("level_id", levelID), zap.Error(err))
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		h.log.Info("async level run enqueued", zap.String("level_id", levelID), zap.String("task_id", taskID))
		c.JSON(http.StatusAccepted, dto.LevelRunResponse{TaskID: taskID, Status: string(service.ModeAsync)})
		return
	}
	h.log.Info("level run completed", zap.String("level_id", levelID), zap.String("mode", string(result.Mode)))
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
	h.log.Info("marking level complete", zap.String("level_id", levelID), zap.Float64("score", req.Score))
	if err := h.service.Complete(c.Request.Context(), levelID, service.CompleteRequest{Score: req.Score, CompletedAt: req.CompletedAt}); err != nil {
		h.log.Error("failed to mark level complete", zap.String("level_id", levelID), zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	h.log.Info("level marked complete", zap.String("level_id", levelID))
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
	h.log.Info("running sandbox", zap.String("level_id", levelID), zap.String("language", req.Language), zap.Int("code_len", len(req.Code)))
	result, err := h.service.Sandbox(c.Request.Context(), levelID, service.SandboxRequest{Code: req.Code, Language: req.Language})
	if err != nil {
		h.log.Error("sandbox run failed", zap.String("level_id", levelID), zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	h.log.Info("sandbox run finished", zap.String("level_id", levelID), zap.String("mode", string(result.Mode)))
	c.JSON(http.StatusOK, dto.LevelRunResponse{Status: string(result.Mode), Output: result.Output})
}

func (h *Handler) respondValidationError(c *gin.Context, err error) {
	h.log.Warn("student request validation failed", zap.String("path", c.FullPath()), zap.Error(err))
	c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
}
