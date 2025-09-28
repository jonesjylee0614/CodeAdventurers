package auth

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"

	"github.com/codeadventurers/api-go/internal/http/dto"
	service "github.com/codeadventurers/api-go/internal/service/auth"
)

// Handler hosts authentication endpoints.
type Handler struct {
	service  *service.Service
	validate *validator.Validate
}

// New creates the auth handler.
func New(service *service.Service, validate *validator.Validate) *Handler {
	return &Handler{service: service, validate: validate}
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
	token, err := h.service.GuestLogin(c.Request.Context(), req.Locale)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
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
	token, err := h.service.ClassLogin(c.Request.Context(), req.ClassCode)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.AuthResponse{Token: token.Token, ExpiresIn: token.ExpiresIn})
}

func (h *Handler) respondValidationError(c *gin.Context, err error) {
	c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
}
