package parent

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	service "github.com/codeadventurers/api-go/internal/service/parent"
)

// Handler coordinates parent dashboard HTTP endpoints.
type Handler struct {
	service *service.Service
	log     *zap.Logger
}

// New constructs the handler.
func New(service *service.Service, log *zap.Logger) *Handler {
	return &Handler{service: service, log: log}
}

func (h *Handler) parentID(c *gin.Context) string {
	if header := c.GetHeader("x-user-id"); header != "" {
		return header
	}
	return "parent-demo"
}

// Overview returns parent overview data.
func (h *Handler) Overview(c *gin.Context) {
	result, err := h.service.Overview(c.Request.Context(), h.parentID(c))
	if err != nil {
		h.handleError(c, err)
		return
	}
	c.JSON(http.StatusOK, result)
}

// Children returns child summaries.
func (h *Handler) Children(c *gin.Context) {
	result, err := h.service.Children(c.Request.Context(), h.parentID(c))
	if err != nil {
		h.handleError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"children": result})
}

// WeeklyReport returns a child weekly report.
func (h *Handler) WeeklyReport(c *gin.Context) {
	childID := c.Param("childId")
	result, err := h.service.WeeklyReport(c.Request.Context(), h.parentID(c), childID)
	if err != nil {
		h.handleError(c, err)
		return
	}
	c.JSON(http.StatusOK, result)
}

// Progress returns child progress records.
func (h *Handler) Progress(c *gin.Context) {
	childID := c.Param("childId")
	result, err := h.service.Progress(c.Request.Context(), h.parentID(c), childID)
	if err != nil {
		h.handleError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"progress": result})
}

// Settings returns notification preferences.
func (h *Handler) Settings(c *gin.Context) {
	result, err := h.service.Settings(c.Request.Context(), h.parentID(c))
	if err != nil {
		h.handleError(c, err)
		return
	}
	c.JSON(http.StatusOK, result)
}

// UpdateSettings updates notification preferences.
func (h *Handler) UpdateSettings(c *gin.Context) {
	var payload struct {
		ReminderTime    *string  `json:"reminderTime"`
		WeeklyReportDay *string  `json:"weeklyReportDay"`
		NotifyChannels  []string `json:"notifyChannels"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		h.log.Warn("invalid parent settings payload", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求格式不正确"})
		return
	}

	result, err := h.service.UpdateSettings(c.Request.Context(), h.parentID(c), service.SettingsUpdate{
		ReminderTime:    payload.ReminderTime,
		WeeklyReportDay: payload.WeeklyReportDay,
		NotifyChannels:  payload.NotifyChannels,
	})
	if err != nil {
		h.handleError(c, err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *Handler) handleError(c *gin.Context, err error) {
	switch err {
	case service.ErrParentNotFound:
		h.log.Warn("parent profile not found", zap.Error(err))
		c.JSON(http.StatusNotFound, gin.H{"error": "未找到家长信息"})
	case service.ErrChildNotFound:
		h.log.Warn("child profile not found", zap.Error(err))
		c.JSON(http.StatusNotFound, gin.H{"error": "未找到孩子信息"})
	default:
		h.log.Error("parent request failed", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "服务器异常，请稍后再试"})
	}
}


