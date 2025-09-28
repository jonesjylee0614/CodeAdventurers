package dto

import (
	service "github.com/codeadventurers/api-go/internal/service/student"
)

// GuestAuthRequest represents the payload for guest authentication.
type GuestAuthRequest struct {
	Name   string `json:"name" validate:"required_without=Locale"`
	Locale string `json:"locale"`
}

// ClassAuthRequest represents the payload for joining a class.
type ClassAuthRequest struct {
	InviteCode string `json:"inviteCode" validate:"required"`
	Name       string `json:"name" validate:"required"`
}

// CredentialAuthRequest represents the payload for role based login.
type CredentialAuthRequest struct {
	Identifier string `json:"identifier" validate:"required"`
	Password   string `json:"password" validate:"required"`
	Role       string `json:"role" validate:"required,oneof=teacher parent admin student"`
}

// AuthResponse contains the unified authentication response.
type AuthResponse struct {
	UserID   string   `json:"userId"`
	Name     string   `json:"name"`
	Role     string   `json:"role"`
	ClassID  string   `json:"classId,omitempty"`
	Children []string `json:"childIds,omitempty"`
	Managed  []string `json:"managedClassIds,omitempty"`
	Courses  []string `json:"courseIds,omitempty"`
}

// CredentialAuthResponse wraps the profile returned after credential login.
type CredentialAuthResponse struct {
	User AuthResponse `json:"user"`
}

// StudentRunRequest describes a block-program execution request.
type StudentRunRequest struct {
	Program []service.Instruction `json:"program" validate:"required,min=1,dive"`
}

// StudentCompleteRequest records a completion event for a level.
type StudentCompleteRequest struct {
	Stars          int                      `json:"stars" validate:"required,min=0"`
	Steps          int                      `json:"steps" validate:"required,min=0"`
	Hints          *int                     `json:"hints" validate:"omitempty,min=0"`
	Duration       *int                     `json:"duration" validate:"omitempty,min=0"`
	BestDifference *int                     `json:"bestDifference"`
	ReplayLog      []service.SimulationStep `json:"replayLog"`
}

// ToDomain converts the DTO into the service request object.
func (r StudentCompleteRequest) ToDomain() service.CompleteRequest {
	return service.CompleteRequest{
		Stars:          r.Stars,
		Steps:          r.Steps,
		Hints:          r.Hints,
		Duration:       r.Duration,
		BestDifference: r.BestDifference,
		ReplayLog:      r.ReplayLog,
	}
}

// StudentHintRequest captures attempts information for computing hints.
type StudentHintRequest struct {
	Attempts  int     `json:"attempts" validate:"min=0"`
	LastError *string `json:"lastError"`
}

// ToDomain converts the DTO into the service hint payload.
func (r StudentHintRequest) ToDomain() service.HintRequest {
	return service.HintRequest{Attempts: r.Attempts, LastError: r.LastError}
}

// StudentSettingsUpdateRequest updates student preference options.
type StudentSettingsUpdateRequest struct {
	Volume    *int    `json:"volume" validate:"omitempty,min=0,max=100"`
	LowMotion *bool   `json:"lowMotion"`
	Language  *string `json:"language" validate:"omitempty,min=2"`
}

// ToDomain converts the DTO into service options.
func (r StudentSettingsUpdateRequest) ToDomain() service.SettingsUpdate {
	return service.SettingsUpdate{Volume: r.Volume, LowMotion: r.LowMotion, Language: r.Language}
}

// StudentAvatarUpdateRequest equips a new avatar for the student.
type StudentAvatarUpdateRequest struct {
	Equipped string `json:"equipped" validate:"required"`
}

// ToDomain converts the DTO to service payload.
func (r StudentAvatarUpdateRequest) ToDomain() service.AvatarUpdate {
	return service.AvatarUpdate{Equipped: r.Equipped}
}
