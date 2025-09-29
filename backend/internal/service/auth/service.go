package auth

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
)

// Service orchestrates authentication use cases.
type Service struct {
	classrooms  map[string]classroom
	credentials map[string]map[string]credential
}

type classroom struct {
	ClassID string
}

type credential struct {
	Password string
	Profile  Profile
}

// Profile describes the authenticated subject in a unified format.
type Profile struct {
	UserID          string
	Name            string
	Role            string
	ClassID         string
	ChildIDs        []string
	ManagedClassIDs []string
	CourseIDs       []string
}

// ErrInvalidCredentials is returned when the identifier/password combination
// does not match the expected record.
var ErrInvalidCredentials = errors.New("invalid credentials")

// ErrUnknownRole indicates an unsupported role was supplied.
var ErrUnknownRole = errors.New("unknown role")

// ErrInvalidInviteCode indicates the class invite code is not recognised.
var ErrInvalidInviteCode = errors.New("invalid invite code")

// New creates a new authentication service instance populated with demo data.
func New() *Service {
	return &Service{
		classrooms: map[string]classroom{
			normalizeInviteCode("ABC123"):    {ClassID: "class-1"},
			normalizeInviteCode("DEF456"):    {ClassID: "class-2"},
			normalizeInviteCode("CA-CLASS-1"): {ClassID: "class-1"},
			normalizeInviteCode("CA-CLASS-2"): {ClassID: "class-2"},
			normalizeInviteCode("CA-CLASS-3"): {ClassID: "class-3"},
			normalizeInviteCode("A-CLASS-2"):  {ClassID: "class-2"},
		},
		credentials: map[string]map[string]credential{
			"teacher": {
				"teacher-1": {
					Password: "teach123",
					Profile: Profile{
						UserID:          "teacher-1",
						Name:            "陈老师",
						Role:            "teacher",
						ManagedClassIDs: []string{"class-1", "class-2"},
						CourseIDs:       []string{"course-intro", "course-advanced"},
					},
				},
			},
			"parent": {
				"parent-1": {
					Password: "parent123",
					Profile: Profile{
						UserID:   "parent-1",
						Name:     "李家长",
						Role:     "parent",
						ChildIDs: []string{"student-1"},
					},
				},
			},
		},
	}
}

// GuestLogin returns a short-lived guest profile.
func (s *Service) GuestLogin(ctx context.Context, name string) (Profile, error) {
	trimmed := strings.TrimSpace(name)
	if trimmed == "" {
		trimmed = "游客"
	}
	return Profile{
		UserID: fmt.Sprintf("guest-%s", uuid.NewString()),
		Name:   trimmed,
		Role:   "guest",
	}, nil
}

// ClassLogin validates the class invite code and returns a student profile.
func (s *Service) ClassLogin(ctx context.Context, inviteCode, name string) (Profile, error) {
	class, ok := s.classrooms[normalizeInviteCode(inviteCode)]
	if !ok {
		return Profile{}, ErrInvalidInviteCode
	}
	trimmed := strings.TrimSpace(name)
	if trimmed == "" {
		trimmed = "匿名学员"
	}
	return Profile{
		UserID:  fmt.Sprintf("student-%s", uuid.NewString()),
		Name:    trimmed,
		Role:    "student",
		ClassID: class.ClassID,
	}, nil
}

func normalizeInviteCode(code string) string {
	trimmed := strings.TrimSpace(code)
	upper := strings.ToUpper(trimmed)
	return strings.ReplaceAll(upper, "-", "")
}

// CredentialLogin validates credentials for the provided role and returns the
// associated profile when successful.
func (s *Service) CredentialLogin(ctx context.Context, identifier, password, role string) (Profile, error) {
	records, ok := s.credentials[role]
	if !ok {
		return Profile{}, ErrUnknownRole
	}
	record, ok := records[identifier]
	if !ok || record.Password != password {
		return Profile{}, ErrInvalidCredentials
	}
	return record.Profile, nil
}
