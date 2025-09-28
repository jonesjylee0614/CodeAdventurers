package logger

import (
	"context"

	"go.uber.org/zap"
)

// New creates a zap.Logger configured for the current environment.
func New(env string) (*zap.Logger, error) {
	if env == "dev" || env == "development" {
		cfg := zap.NewDevelopmentConfig()
		cfg.Encoding = "json"
		return cfg.Build()
	}
	return zap.NewProduction()
}

// WithContext returns a context enriched with the provided zap logger for downstream usage.
func WithContext(ctx context.Context, log *zap.Logger) context.Context {
	return context.WithValue(ctx, contextKey{}, log)
}

// FromContext extracts a zap logger from the context or returns a no-op logger.
func FromContext(ctx context.Context) *zap.Logger {
	if log, ok := ctx.Value(contextKey{}).(*zap.Logger); ok {
		return log
	}
	return zap.NewNop()
}

type contextKey struct{}
