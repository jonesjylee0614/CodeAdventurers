package teacher

import "context"

// Service exposes analytics endpoints for teachers.
type Service struct{}

// New constructs the teacher service.
func New() *Service { return &Service{} }

// Analytics returns aggregated metrics for the requested resource.
func (s *Service) Analytics(ctx context.Context, resource string, query map[string]string) (map[string]any, error) {
	return map[string]any{
		"resource": resource,
		"data":     []any{},
	}, nil
}
