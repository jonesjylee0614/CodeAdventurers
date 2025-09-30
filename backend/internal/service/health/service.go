package health

import (
	"context"

	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

// Service provides health and readiness checks.
type Service struct {
	db    *gorm.DB
	redis *redis.Client
}

// New constructs the health service.
func New(db *gorm.DB, redis *redis.Client) *Service {
	return &Service{db: db, redis: redis}
}

// Liveness simply confirms the process is running.
func (s *Service) Liveness(ctx context.Context) map[string]string {
	return map[string]string{"status": "ok"}
}

// Readiness verifies downstream dependencies.
func (s *Service) Readiness(ctx context.Context) map[string]string {
	status := map[string]string{"status": "ready"}
	if s.db != nil {
		sqlDB, err := s.db.DB()
		if err != nil {
			status["mysql"] = err.Error()
			status["status"] = "degraded"
		} else if err := sqlDB.PingContext(ctx); err != nil {
			status["mysql"] = err.Error()
			status["status"] = "degraded"
		} else {
			status["mysql"] = "ok"
		}
	}
	if s.redis != nil {
		if err := s.redis.Ping(ctx).Err(); err != nil {
			status["redis"] = err.Error()
			status["status"] = "degraded"
		} else {
			status["redis"] = "ok"
		}
	}
	return status
}
