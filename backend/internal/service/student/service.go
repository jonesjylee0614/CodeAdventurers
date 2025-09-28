package student

import "context"

// Service coordinates student-facing workflows.
type Service struct{}

// New constructs a student service.
func New() *Service { return &Service{} }

// Map returns the visible student map.
func (s *Service) Map(ctx context.Context) (Map, error) {
	return Map{Levels: []LevelSummary{}}, nil
}

// Prep returns preparation data for the requested level.
func (s *Service) Prep(ctx context.Context, id string) (Prep, error) {
	return Prep{ID: id, StarterCode: "// TODO", Hints: []string{}}, nil
}

// Run decides whether to run synchronously or enqueue asynchronously.
func (s *Service) Run(ctx context.Context, id string, req RunRequest) (RunResult, error) {
	return RunResult{Mode: ModeSync, Output: "Execution pending"}, nil
}

// Complete marks a level as completed.
func (s *Service) Complete(ctx context.Context, id string, req CompleteRequest) error {
	return nil
}

// Sandbox executes sandbox runs without persisting results.
func (s *Service) Sandbox(ctx context.Context, id string, req SandboxRequest) (RunResult, error) {
	return RunResult{Mode: ModeSync, Output: "Sandbox execution pending"}, nil
}

// Supporting domain types

type Map struct {
	Levels []LevelSummary
}

type LevelSummary struct {
	ID     string
	Name   string
	Status string
}

type Prep struct {
	ID          string
	StarterCode string
	Hints       []string
}

type RunRequest struct {
	Code     string
	Language string
}

type CompleteRequest struct {
	Score       float64
	CompletedAt string
}

type SandboxRequest struct {
	Code     string
	Language string
}

type Mode string

const (
	ModeSync  Mode = "sync"
	ModeAsync Mode = "async"
)

type RunResult struct {
	Mode    Mode
	TaskID  string
	Output  string
	Message string
}
