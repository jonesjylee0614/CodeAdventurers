package dto

// GuestAuthRequest represents the payload for guest authentication.
type GuestAuthRequest struct {
	Locale string `json:"locale" validate:"required"`
}

// ClassAuthRequest represents the payload for joining a class.
type ClassAuthRequest struct {
	ClassCode string `json:"classCode" validate:"required"`
}

// AuthResponse contains the JWT token and expiry information.
type AuthResponse struct {
	Token     string `json:"token"`
	ExpiresIn int64  `json:"expiresIn"`
}

// LevelRunRequest describes a code execution request.
type LevelRunRequest struct {
	Code     string `json:"code" validate:"required"`
	Language string `json:"language" validate:"required"`
}

// LevelRunResponse indicates whether the execution was synchronous or asynchronous.
type LevelRunResponse struct {
	TaskID string `json:"taskId,omitempty"`
	Status string `json:"status"`
	Output string `json:"output,omitempty"`
}

// LevelCompleteRequest records a completion event for a level.
type LevelCompleteRequest struct {
	Score       float64 `json:"score"`
	CompletedAt string  `json:"completedAt" validate:"datetime"`
}

// SandboxRunRequest is identical to LevelRunRequest but stored separately for clarity.
type SandboxRunRequest struct {
	Code     string `json:"code" validate:"required"`
	Language string `json:"language" validate:"required"`
}
