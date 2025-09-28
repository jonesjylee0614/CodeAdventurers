package server

import (
	"context"
	"errors"
	"net/http"
	"time"
)

// HTTPServer wraps an http.Server with graceful shutdown helpers.
type HTTPServer struct {
	server *http.Server
}

// New creates a new HTTPServer listening on addr with the provided handler.
func New(addr string, handler http.Handler) *HTTPServer {
	return &HTTPServer{
		server: &http.Server{
			Addr:              addr,
			Handler:           handler,
			ReadHeaderTimeout: 5 * time.Second,
			ReadTimeout:       30 * time.Second,
			WriteTimeout:      30 * time.Second,
			IdleTimeout:       120 * time.Second,
		},
	}
}

// Start runs the HTTP server until the context is cancelled.
func (s *HTTPServer) Start(ctx context.Context) error {
	errCh := make(chan error, 1)
	go func() {
		errCh <- s.server.ListenAndServe()
	}()

	select {
	case <-ctx.Done():
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		_ = s.server.Shutdown(shutdownCtx)
		return nil
	case err := <-errCh:
		if err == nil || errors.Is(err, http.ErrServerClosed) {
			return nil
		}
		return err
	}
}
