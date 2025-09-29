package teacher

import (
	"net/http"
	"strconv"

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

// Courses lists all available teacher courses.
func (h *Handler) Courses(c *gin.Context) {
	result, err := h.service.Courses(c.Request.Context())
	if err != nil {
		h.log.Error("failed to fetch teacher courses", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"courses": result})
}

// Classes returns class summaries for the teacher.
func (h *Handler) Classes(c *gin.Context) {
	result, err := h.service.Classes(c.Request.Context())
	if err != nil {
		h.log.Error("failed to fetch teacher classes", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"classes": result})
}

// ClassDetail returns details for a class.
func (h *Handler) ClassDetail(c *gin.Context) {
	classID := c.Param("classId")
	result, err := h.service.ClassDetail(c.Request.Context(), classID)
	if err != nil {
		h.log.Warn("class detail fetch failed", zap.String("class_id", classID), zap.Error(err))
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}

// UpdateHintLimit updates hint limit for a class.
func (h *Handler) UpdateHintLimit(c *gin.Context) {
	classID := c.Param("classId")
	var payload struct {
		HintLimit int `json:"hintLimit"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		h.log.Warn("invalid hint limit payload", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求体格式不正确"})
		return
	}
	if payload.HintLimit == 0 {
		if raw := c.Query("hintLimit"); raw != "" {
			if parsed, err := strconv.Atoi(raw); err == nil {
				payload.HintLimit = parsed
			}
		}
	}
	if payload.HintLimit <= 0 {
		payload.HintLimit = 1
	}

	if err := h.service.UpdateClassHintLimit(c.Request.Context(), classID, payload.HintLimit); err != nil {
		h.log.Warn("update hint limit failed", zap.String("class_id", classID), zap.Error(err))
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// PendingWorks lists pending works for review.
func (h *Handler) PendingWorks(c *gin.Context) {
	result, err := h.service.PendingWorks(c.Request.Context())
	if err != nil {
		h.log.Error("failed to fetch pending works", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"works": result})
}

// ReviewWork marks a work as reviewed.
func (h *Handler) ReviewWork(c *gin.Context) {
	workID := c.Param("workId")
	var payload struct {
		Status string `json:"status"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		h.log.Warn("invalid review payload", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求体格式不正确"})
		return
	}
	if err := h.service.ReviewWork(c.Request.Context(), workID, payload.Status); err != nil {
		h.log.Warn("review work failed", zap.String("work_id", workID), zap.Error(err))
		status := http.StatusBadRequest
		if err == service.ErrWorkNotFound {
			status = http.StatusNotFound
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// AssignCourse assigns a course to a class.
func (h *Handler) AssignCourse(c *gin.Context) {
	classID := c.Param("classId")
	var payload struct {
		CourseID string `json:"courseId"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil || payload.CourseID == "" {
		h.log.Warn("invalid assign course payload", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": "请提供课程 ID"})
		return
	}

	if err := h.service.AssignCourseToClass(c.Request.Context(), classID, payload.CourseID); err != nil {
		h.log.Warn("assign course failed", zap.String("class_id", classID), zap.String("course_id", payload.CourseID), zap.Error(err))
		status := http.StatusBadRequest
		if err == service.ErrClassNotFound || err == service.ErrCourseNotFound {
			status = http.StatusNotFound
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}
