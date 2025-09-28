package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

// Config represents the full runtime configuration loaded from environment variables.
type Config struct {
	Env         string
	Port        int
	JWTSecret   string
	CORSOrigins []string

	MySQL MySQLConfig
	Redis RedisConfig
	Asynq AsynqConfig

	RateLimit RateLimitConfig
	Telemetry TelemetryConfig
}

// MySQLConfig contains parameters for connecting to the relational database.
type MySQLConfig struct {
	DSN             string
	MaxOpenConns    int
	MaxIdleConns    int
	ConnMaxLifetime time.Duration
}

// RedisConfig contains parameters for connecting to Redis.
type RedisConfig struct {
	Addr     string
	Password string
	DB       int
}

// AsynqConfig defines the worker pool settings for asynchronous workloads.
type AsynqConfig struct {
	Concurrency int
	Queues      map[string]int
}

// RateLimitConfig controls rate limiting on the HTTP layer.
type RateLimitConfig struct {
	PerMinute int
}

// TelemetryConfig includes OpenTelemetry and Prometheus parameters.
type TelemetryConfig struct {
	OTLPEndpoint string
	MetricsPath  string
}

// Load builds the Config structure by reading environment variables and applying sane defaults.
func Load() Config {
	return Config{
		Env:         getEnv("ENV", "dev"),
		Port:        getEnvAsInt("PORT", 8080),
		JWTSecret:   getEnv("JWT_SECRET", "change-me"),
		CORSOrigins: splitAndTrim(getEnv("CORS_ORIGINS", "")),
		MySQL: MySQLConfig{
			DSN:             getEnv("MYSQL_DSN", "mysql://user:pass@tcp(localhost:3306)/code_adventurers?parseTime=true&charset=utf8mb4"),
			MaxOpenConns:    getEnvAsInt("MYSQL_MAX_OPEN_CONNS", 16),
			MaxIdleConns:    getEnvAsInt("MYSQL_MAX_IDLE_CONNS", 8),
			ConnMaxLifetime: getEnvAsDuration("MYSQL_CONN_MAX_LIFETIME", time.Minute*5),
		},
		Redis: RedisConfig{
			Addr:     getEnv("REDIS_ADDR", "localhost:6379"),
			Password: getEnv("REDIS_PASSWORD", ""),
			DB:       getEnvAsInt("REDIS_DB", 0),
		},
		Asynq: AsynqConfig{
			Concurrency: getEnvAsInt("ASYNQ_CONCURRENCY", 32),
			Queues:      parseQueueWeights(getEnv("ASYNQ_QUEUES", "default=10,critical=20")),
		},
		RateLimit: RateLimitConfig{
			PerMinute: getEnvAsInt("RATE_LIMIT_PER_MINUTE", 600),
		},
		Telemetry: TelemetryConfig{
			OTLPEndpoint: getEnv("OTEL_EXPORTER_OTLP_ENDPOINT", ""),
			MetricsPath:  getEnv("PROMETHEUS_METRICS_PATH", "/metrics"),
		},
	}
}

// Addr returns the network address the HTTP server should listen on.
func (c Config) Addr() string {
	return fmt.Sprintf(":%d", c.Port)
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func getEnvAsInt(key string, fallback int) int {
	if value := os.Getenv(key); value != "" {
		if v, err := strconv.Atoi(value); err == nil {
			return v
		}
	}
	return fallback
}

func getEnvAsDuration(key string, fallback time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if d, err := time.ParseDuration(value); err == nil {
			return d
		}
	}
	return fallback
}

func splitAndTrim(raw string) []string {
	if raw == "" {
		return nil
	}
	parts := strings.Split(raw, ",")
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		if trimmed := strings.TrimSpace(part); trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}

func parseQueueWeights(raw string) map[string]int {
	if raw == "" {
		return map[string]int{"default": 1}
	}
	queues := make(map[string]int)
	pairs := strings.Split(raw, ",")
	for _, pair := range pairs {
		parts := strings.Split(strings.TrimSpace(pair), "=")
		if len(parts) != 2 {
			continue
		}
		weight, err := strconv.Atoi(parts[1])
		if err != nil {
			continue
		}
		queues[parts[0]] = weight
	}
	if len(queues) == 0 {
		queues["default"] = 1
	}
	return queues
}
