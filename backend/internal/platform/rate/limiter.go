package rate

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

// Limiter provides a token bucket limiter keyed by user identifier or IP.
type Limiter struct {
	limit      rate.Limit
	burst      int
	mu         sync.Mutex
	visitors   map[string]*visitor
	cleanupTTL time.Duration
}

type visitor struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

// New returns a limiter allowing n events per minute.
func New(perMinute int) *Limiter {
	return &Limiter{
		limit:      rate.Limit(float64(perMinute) / 60.0),
		burst:      perMinute,
		visitors:   make(map[string]*visitor),
		cleanupTTL: 3 * time.Minute,
	}
}

// Middleware returns a gin handler that enforces the rate limit.
func (l *Limiter) Middleware() gin.HandlerFunc {
	go l.cleanup()
	return func(c *gin.Context) {
		key := c.GetString("user_id")
		if key == "" {
			key = c.ClientIP()
		}
		limiter := l.getVisitor(key)
		if limiter.Allow() {
			c.Next()
			return
		}
		c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{"error": "rate limit exceeded"})
	}
}

func (l *Limiter) getVisitor(key string) *rate.Limiter {
	l.mu.Lock()
	defer l.mu.Unlock()

	if v, ok := l.visitors[key]; ok {
		v.lastSeen = time.Now()
		return v.limiter
	}

	limiter := rate.NewLimiter(l.limit, l.burst)
	l.visitors[key] = &visitor{limiter: limiter, lastSeen: time.Now()}
	return limiter
}

func (l *Limiter) cleanup() {
	ticker := time.NewTicker(time.Minute)
	defer ticker.Stop()
	for range ticker.C {
		now := time.Now()
		l.mu.Lock()
		for key, v := range l.visitors {
			if now.Sub(v.lastSeen) > l.cleanupTTL {
				delete(l.visitors, key)
			}
		}
		l.mu.Unlock()
	}
}
