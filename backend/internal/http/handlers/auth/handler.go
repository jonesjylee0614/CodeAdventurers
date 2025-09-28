package auth

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"go.uber.org/zap"

	"github.com/codeadventurers/api-go/internal/http/dto"
	service "github.com/codeadventurers/api-go/internal/service/auth"
)

// Handler hosts authentication endpoints.
type Handler struct {
	service  *service.Service
	validate *validator.Validate
	log      *zap.Logger
}

// New creates the auth handler.
func New(service *service.Service, validate *validator.Validate, log *zap.Logger) *Handler {
	return &Handler{service: service, validate: validate, log: log}
}

// Guest handles guest login with the display name supplied by the frontend.
func (h *Handler) Guest(c *gin.Context) {
	var req dto.GuestAuthRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.respondValidationError(c, err)
		return
	}
	if err := h.validate.Struct(req); err != nil {
		h.respondValidationError(c, err)
		return
	}
	h.log.Info("handling guest login", zap.String("name", req.Name))
	profile, err := h.service.GuestLogin(c.Request.Context(), req.Name)
	if err != nil {
		h.log.Error("guest login failed", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	h.log.Info("guest login succeeded", zap.String("user_id", profile.UserID))
	c.JSON(http.StatusOK, h.fromProfile(profile))
}

// Class handles class based login.
func (h *Handler) Class(c *gin.Context) {
	var req dto.ClassAuthRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.respondValidationError(c, err)
		return
	}
	if err := h.validate.Struct(req); err != nil {
		h.respondValidationError(c, err)
		return
	}
	h.log.Info("handling class login", zap.String("invite_code", req.InviteCode))
	profile, err := h.service.ClassLogin(c.Request.Context(), req.InviteCode, req.Name)
	if err != nil {
		h.respondAuthError(c, err, "class", req.InviteCode)
		return
	}
	h.log.Info("class login succeeded", zap.String("user_id", profile.UserID), zap.String("class_id", profile.ClassID))
	c.JSON(http.StatusOK, h.fromProfile(profile))
}

func (h *Handler) respondValidationError(c *gin.Context, err error) {
	h.log.Warn("authentication request validation failed", zap.String("path", c.FullPath()), zap.Error(err))
	c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
}

// Login handles credential based login for teachers、家长等角色.
func (h *Handler) Login(c *gin.Context) {
	var req dto.CredentialAuthRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.respondValidationError(c, err)
		return
	}
	if err := h.validate.Struct(req); err != nil {
		h.respondValidationError(c, err)
		return
	}
	h.log.Info("handling credential login", zap.String("role", req.Role), zap.String("identifier", req.Identifier))
	profile, err := h.service.CredentialLogin(c.Request.Context(), req.Identifier, req.Password, req.Role)
	if err != nil {
		h.respondAuthError(c, err, req.Role, req.Identifier)
		return
	}
	c.JSON(http.StatusOK, dto.CredentialAuthResponse{User: h.fromProfile(profile)})
}

func (h *Handler) fromProfile(profile service.Profile) dto.AuthResponse {
	return dto.AuthResponse{
		UserID:  profile.UserID,
		Name:    profile.Name,
		Role:    profile.Role,
		ClassID: profile.ClassID,
		Children: func() []string {
			if len(profile.ChildIDs) == 0 {
				return nil
			}
			return profile.ChildIDs
		}(),
		Managed: func() []string {
			if len(profile.ManagedClassIDs) == 0 {
				return nil
			}
			return profile.ManagedClassIDs
		}(),
		Courses: func() []string {
			if len(profile.CourseIDs) == 0 {
				return nil
			}
			return profile.CourseIDs
		}(),
	}
}

func (h *Handler) respondAuthError(c *gin.Context, err error, contextRole string, identifier string) {
	switch {
	case errors.Is(err, service.ErrInvalidCredentials):
		h.log.Warn("authentication failed", zap.String("role", contextRole), zap.String("identifier", identifier), zap.Error(err))
		c.JSON(http.StatusUnauthorized, gin.H{"error": "账号或密码不正确"})
	case errors.Is(err, service.ErrInvalidInviteCode):
		h.log.Warn("invalid invite code", zap.String("code", identifier), zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": "班级邀请码无效"})
	case errors.Is(err, service.ErrUnknownRole):
		h.log.Warn("unknown role supplied", zap.String("role", contextRole), zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": "不支持的角色类型"})
	default:
		h.log.Error("authentication failure", zap.String("context", contextRole), zap.String("identifier", identifier), zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "登录失败，请稍后再试"})
	}
}
