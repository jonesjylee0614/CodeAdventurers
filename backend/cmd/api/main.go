package main

import (
	"context"
	"log"
	"os/signal"
	"syscall"

	"github.com/go-playground/validator/v10"
	"github.com/hibiken/asynq"
	"go.uber.org/automaxprocs/maxprocs"

	"github.com/codeadventurers/api-go/internal/http/handlers/auth"
	"github.com/codeadventurers/api-go/internal/http/handlers/health"
	"github.com/codeadventurers/api-go/internal/http/handlers/student"
	"github.com/codeadventurers/api-go/internal/http/handlers/teacher"
	wsHandler "github.com/codeadventurers/api-go/internal/http/handlers/ws"
	"github.com/codeadventurers/api-go/internal/http/router"
	"github.com/codeadventurers/api-go/internal/jobs"
	"github.com/codeadventurers/api-go/internal/platform/cache"
	"github.com/codeadventurers/api-go/internal/platform/config"
	"github.com/codeadventurers/api-go/internal/platform/logger"
	"github.com/codeadventurers/api-go/internal/platform/rate"
	"github.com/codeadventurers/api-go/internal/platform/server"
	"github.com/codeadventurers/api-go/internal/platform/storage"
	"github.com/codeadventurers/api-go/internal/platform/telemetry"
	authService "github.com/codeadventurers/api-go/internal/service/auth"
	healthService "github.com/codeadventurers/api-go/internal/service/health"
	studentService "github.com/codeadventurers/api-go/internal/service/student"
	teacherService "github.com/codeadventurers/api-go/internal/service/teacher"
	"github.com/codeadventurers/api-go/internal/ws"
	"go.uber.org/zap"
)

func main() {
	if _, err := maxprocs.Set(); err != nil {
		log.Printf("failed to set GOMAXPROCS: %v", err)
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	cfg := config.Load()

	loggr, err := logger.New(cfg.Env)
	if err != nil {
		log.Fatalf("failed to initialize logger: %v", err)
	}
	defer loggr.Sync()

	ctx = logger.WithContext(ctx, loggr)

	tel, err := telemetry.Setup(ctx, "api-go", cfg.Telemetry.OTLPEndpoint)
	if err != nil {
		loggr.Warn("failed to initialize OpenTelemetry", zapError(err))
	}
	if tel != nil {
		defer tel.Shutdown(context.Background())
	}

	db, err := storage.NewMySQL(ctx, cfg.MySQL)
	if err != nil {
		loggr.Fatal("failed to connect to MySQL", zapError(err))
	}
	defer db.Close()

	redisClient := cache.NewRedis(cfg.Redis)
	defer redisClient.Close()

	asynqClient := asynq.NewClient(asynq.RedisClientOpt{Addr: cfg.Redis.Addr, Password: cfg.Redis.Password, DB: cfg.Redis.DB})
	defer asynqClient.Close()

	jobDispatcher := jobs.NewDispatcher(asynqClient)

	validate := validator.New()

	authSvc := authService.New()
	studentSvc := studentService.New()
	teacherSvc := teacherService.New()
	healthSvc := healthService.New(db, redisClient)

	authH := auth.New(authSvc, validate, loggr.Named("auth-handler"))
	studentH := student.New(studentSvc, jobDispatcher, validate, loggr.Named("student-handler"))
	teacherH := teacher.New(teacherSvc, loggr.Named("teacher-handler"))
	healthH := health.New(healthSvc, loggr.Named("health-handler"))
	wsMgr := ws.NewManager()
	wsH := wsHandler.New(wsMgr, loggr.Named("ws-handler"))

	rateLimiter := rate.New(cfg.RateLimit.PerMinute)

	engine := router.New(router.Dependencies{
		Config:      cfg,
		Auth:        authH,
		Student:     studentH,
		Teacher:     teacherH,
		Health:      healthH,
		WS:          wsH,
		RateLimiter: rateLimiter,
	})

	srv := server.New(cfg.Addr(), engine)

	loggr.Info("api server starting", zap.String("addr", cfg.Addr()), zap.String("env", cfg.Env))

	if err := srv.Start(ctx); err != nil {
		if err == context.Canceled {
			loggr.Info("server shutdown requested", zap.String("reason", "context canceled"))
			return
		}
		loggr.Fatal("server terminated", zapError(err))
	}

	loggr.Info("api server stopped cleanly")
}

func zapError(err error) zap.Field {
	return zap.Error(err)
}
