package auth

import (
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

// Guest issues guest tokens while keeping the response shape compatible with the legacy API.
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
	h.log.Info("handling guest login", zap.String("locale", req.Locale))
	token, err := h.service.GuestLogin(c.Request.Context(), req.Locale)
	if err != nil {
		h.log.Error("guest login failed", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	h.log.Info("guest login succeeded", zap.String("locale", req.Locale))
	c.JSON(http.StatusOK, dto.AuthResponse{Token: token.Token, ExpiresIn: token.ExpiresIn})
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
	h.log.Info("handling class login", zap.String("class_code", req.ClassCode))
	token, err := h.service.ClassLogin(c.Request.Context(), req.ClassCode)
	if err != nil {
		h.log.Error("class login failed", zap.String("class_code", req.ClassCode), zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	h.log.Info("class login succeeded", zap.String("class_code", req.ClassCode))
	c.JSON(http.StatusOK, dto.AuthResponse{Token: token.Token, ExpiresIn: token.ExpiresIn})
}

func (h *Handler) respondValidationError(c *gin.Context, err error) {
	h.log.Warn("authentication request validation failed", zap.String("path", c.FullPath()), zap.Error(err))
	c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
}
