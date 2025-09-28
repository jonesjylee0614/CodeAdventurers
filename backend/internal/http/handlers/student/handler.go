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

func (h *Handler) userID(c *gin.Context) string {
	if header := c.GetHeader("x-user-id"); header != "" {
		return header
	}
	if header := c.GetHeader("X-User-Id"); header != "" {
		return header
	}
	return "student-demo"
}

// Profile returns the current student profile.
func (h *Handler) Profile(c *gin.Context) {
	userID := h.userID(c)
	h.log.Debug("fetching student profile", zap.String("user_id", userID))
	profile, err := h.service.Profile(c.Request.Context(), userID)
	if err != nil {
		h.log.Error("failed to fetch profile", zap.String("user_id", userID), zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, profile)
}

// Map returns the adventure map for the student.
func (h *Handler) Map(c *gin.Context) {
	userID := h.userID(c)
	h.log.Debug("fetching student map", zap.String("user_id", userID))
	result, err := h.service.Map(c.Request.Context(), userID)
	if err != nil {
		h.log.Error("failed to fetch student map", zap.String("user_id", userID), zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}

// Level returns the level detail for the requested level ID.
func (h *Handler) Level(c *gin.Context) {
	levelID := c.Param("id")
	userID := h.userID(c)
	h.log.Debug("fetching level detail", zap.String("user_id", userID), zap.String("level_id", levelID))
	result, err := h.service.Level(c.Request.Context(), userID, levelID)
	if err != nil {
		h.log.Warn("failed to fetch level detail", zap.String("user_id", userID), zap.String("level_id", levelID), zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}

// Prep returns the preparation payload for a given level.
func (h *Handler) Prep(c *gin.Context) {
	levelID := c.Param("id")
	userID := h.userID(c)
	h.log.Debug("fetching level prep", zap.String("user_id", userID), zap.String("level_id", levelID))
	result, err := h.service.Prep(c.Request.Context(), userID, levelID)
	if err != nil {
		h.log.Error("failed to fetch level prep", zap.String("user_id", userID), zap.String("level_id", levelID), zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}

// Run executes a level program and returns the simulation result.
func (h *Handler) Run(c *gin.Context) {
	levelID := c.Param("id")
	userID := h.userID(c)

	var req dto.StudentRunRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.respondValidationError(c, err)
		return
	}
	if err := h.validate.Struct(req); err != nil {
		h.respondValidationError(c, err)
		return
	}

	h.log.Info("processing level run", zap.String("user_id", userID), zap.String("level_id", levelID), zap.Int("blocks", len(req.Program)))
	result, err := h.service.Run(c.Request.Context(), userID, levelID, req.Program)
	if err != nil {
		h.log.Warn("level run failed", zap.String("user_id", userID), zap.String("level_id", levelID), zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}

// Complete marks the level as completed.
func (h *Handler) Complete(c *gin.Context) {
	levelID := c.Param("id")
	userID := h.userID(c)

	var req dto.StudentCompleteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.respondValidationError(c, err)
		return
	}
	if err := h.validate.Struct(req); err != nil {
		h.respondValidationError(c, err)
		return
	}

	h.log.Info("marking level complete", zap.String("user_id", userID), zap.String("level_id", levelID), zap.Int("stars", req.Stars))
	if err := h.service.Complete(c.Request.Context(), userID, levelID, req.ToDomain()); err != nil {
		h.log.Error("failed to mark level complete", zap.String("user_id", userID), zap.String("level_id", levelID), zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// Sandbox executes code in sandbox mode without affecting progress.
func (h *Handler) Sandbox(c *gin.Context) {
	levelID := c.Param("id")
	userID := h.userID(c)

	var req dto.StudentRunRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.respondValidationError(c, err)
		return
	}
	if err := h.validate.Struct(req); err != nil {
		h.respondValidationError(c, err)
		return
	}

	h.log.Info("running sandbox", zap.String("user_id", userID), zap.String("level_id", levelID))
	result, err := h.service.Sandbox(c.Request.Context(), userID, levelID, req.Program)
	if err != nil {
		h.log.Warn("sandbox run failed", zap.String("user_id", userID), zap.String("level_id", levelID), zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}

// Hint returns contextual hints for the student.
func (h *Handler) Hint(c *gin.Context) {
	levelID := c.Param("id")
	userID := h.userID(c)

	var req dto.StudentHintRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.respondValidationError(c, err)
		return
	}
	if err := h.validate.Struct(req); err != nil {
		h.respondValidationError(c, err)
		return
	}

	result, err := h.service.Hint(c.Request.Context(), userID, levelID, req.ToDomain())
	if err != nil {
		h.log.Warn("failed to compute hint", zap.String("user_id", userID), zap.String("level_id", levelID), zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}

// Settings returns persisted student settings.
func (h *Handler) Settings(c *gin.Context) {
	userID := h.userID(c)
	result, err := h.service.Settings(c.Request.Context(), userID)
	if err != nil {
		h.log.Error("failed to fetch settings", zap.String("user_id", userID), zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}

// UpdateSettings updates student preferences.
func (h *Handler) UpdateSettings(c *gin.Context) {
	userID := h.userID(c)

	var req dto.StudentSettingsUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.respondValidationError(c, err)
		return
	}

	if err := h.validate.Struct(req); err != nil {
		h.respondValidationError(c, err)
		return
	}

	updated, err := h.service.UpdateSettings(c.Request.Context(), userID, req.ToDomain())
	if err != nil {
		h.log.Error("failed to update settings", zap.String("user_id", userID), zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, updated)
}

// ResetProgress clears all stored progress for the student.
func (h *Handler) ResetProgress(c *gin.Context) {
	userID := h.userID(c)
	if err := h.service.ResetProgress(c.Request.Context(), userID); err != nil {
		h.log.Error("failed to reset progress", zap.String("user_id", userID), zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// Avatar returns the avatar state for the student.
func (h *Handler) Avatar(c *gin.Context) {
	userID := h.userID(c)
	state, err := h.service.Avatar(c.Request.Context(), userID)
	if err != nil {
		h.log.Error("failed to fetch avatar", zap.String("user_id", userID), zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, state)
}

// UpdateAvatar equips a new avatar for the student.
func (h *Handler) UpdateAvatar(c *gin.Context) {
	userID := h.userID(c)

	var req dto.StudentAvatarUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.respondValidationError(c, err)
		return
	}
	if err := h.validate.Struct(req); err != nil {
		h.respondValidationError(c, err)
		return
	}

	state, err := h.service.UpdateAvatar(c.Request.Context(), userID, req.ToDomain())
	if err != nil {
		h.log.Warn("failed to update avatar", zap.String("user_id", userID), zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, state)
}

func (h *Handler) respondValidationError(c *gin.Context, err error) {
	h.log.Warn("student request validation failed", zap.String("path", c.FullPath()), zap.Error(err))
	c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
}
