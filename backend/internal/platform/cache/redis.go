package cache

import (
	"context"
	"time"

	"github.com/redis/go-redis/v9"

	"github.com/codeadventurers/api-go/internal/platform/config"
)

// NewRedis returns a configured redis client.
func NewRedis(cfg config.RedisConfig) *redis.Client {
	return redis.NewClient(&redis.Options{
		Addr:         cfg.Addr,
		Password:     cfg.Password,
		DB:           cfg.DB,
		DialTimeout:  5 * time.Second,
		ReadTimeout:  3 * time.Second,
		WriteTimeout: 3 * time.Second,
	})
}

// Ping validates the redis connection.
func Ping(ctx context.Context, client *redis.Client) error {
	return client.Ping(ctx).Err()
}
