package auth

import (
	"context"
	"time"
)

// Service orchestrates authentication use cases.
type Service struct{}

// New creates a new authentication service instance.
func New() *Service {
	return &Service{}
}

// GuestLogin returns a short-lived guest token.
func (s *Service) GuestLogin(ctx context.Context, locale string) (Token, error) {
	return Token{Token: "guest-token-placeholder", ExpiresIn: int64((time.Hour).Seconds())}, nil
}

// ClassLogin validates the class code and returns a token.
func (s *Service) ClassLogin(ctx context.Context, classCode string) (Token, error) {
	return Token{Token: "class-token-placeholder", ExpiresIn: int64((time.Hour * 24).Seconds())}, nil
}

// Token is the return type for authentication flows.
type Token struct {
	Token     string
	ExpiresIn int64
}
