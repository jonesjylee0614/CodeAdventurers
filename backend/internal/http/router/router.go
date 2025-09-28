package router

import (
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin"

	authHandler "github.com/codeadventurers/api-go/internal/http/handlers/auth"
	healthHandler "github.com/codeadventurers/api-go/internal/http/handlers/health"
	studentHandler "github.com/codeadventurers/api-go/internal/http/handlers/student"
	teacherHandler "github.com/codeadventurers/api-go/internal/http/handlers/teacher"
	wsHandler "github.com/codeadventurers/api-go/internal/http/handlers/ws"
	"github.com/codeadventurers/api-go/internal/platform/config"
	"github.com/codeadventurers/api-go/internal/platform/rate"
)

// Dependencies collects the handler dependencies for building the router.
type Dependencies struct {
	Config      config.Config
	Auth        *authHandler.Handler
	Student     *studentHandler.Handler
	Teacher     *teacherHandler.Handler
	Health      *healthHandler.Handler
	WS          *wsHandler.Handler
	RateLimiter *rate.Limiter
}

// New builds the gin router with all routes configured.
func New(deps Dependencies) *gin.Engine {
	gin.SetMode(gin.ReleaseMode)
	engine := gin.New()
	engine.Use(gin.Recovery())
	engine.Use(otelgin.Middleware("api-go"))
	engine.Use(gin.Logger())
	engine.Use(configureCORS(deps.Config))
	if deps.RateLimiter != nil {
		engine.Use(deps.RateLimiter.Middleware())
	}

	registerRoutes(engine, deps)
	return engine
}

func registerRoutes(engine *gin.Engine, deps Dependencies) {
	engine.GET("/healthz", deps.Health.Liveness)
	engine.GET("/readyz", deps.Health.Readiness)
	engine.GET(deps.Config.Telemetry.MetricsPath, gin.WrapH(promhttp.Handler()))

	api := engine.Group("/api")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/guest", deps.Auth.Guest)
			auth.POST("/class", deps.Auth.Class)
			auth.POST("/login", deps.Auth.Login)
		}

		student := api.Group("/student")
		{
			student.GET("/profile", deps.Student.Profile)
			student.GET("/map", deps.Student.Map)
			student.GET("/levels/:id", deps.Student.Level)
			student.GET("/levels/:id/prep", deps.Student.Prep)
			student.POST("/levels/:id/run", deps.Student.Run)
			student.POST("/levels/:id/complete", deps.Student.Complete)
			student.POST("/levels/:id/sandbox", deps.Student.Sandbox)
			student.POST("/hints/:id", deps.Student.Hint)
			student.GET("/settings", deps.Student.Settings)
			student.PUT("/settings", deps.Student.UpdateSettings)
			student.POST("/settings/reset-progress", deps.Student.ResetProgress)
			student.GET("/avatar", deps.Student.Avatar)
			student.PUT("/avatar", deps.Student.UpdateAvatar)
		}

		teacher := api.Group("/teacher")
		{
			teacher.GET("/analytics/*resource", deps.Teacher.Analytics)
		}
	}

	engine.GET("/api/student/run/stream", deps.WS.Stream)
}

func configureCORS(cfg config.Config) gin.HandlerFunc {
	corsConfig := cors.Config{
		AllowCredentials: true,
		AllowMethods:     []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodPatch, http.MethodOptions},
		AllowHeaders:     []string{"Authorization", "Content-Type", "Idempotency-Key", "X-Requested-With", "X-User-Id", "x-user-id"},
		MaxAge:           12 * time.Hour,
	}
	if len(cfg.CORSOrigins) == 0 {
		corsConfig.AllowAllOrigins = true
	} else {
		corsConfig.AllowOrigins = cfg.CORSOrigins
	}
	return cors.New(corsConfig)
}
