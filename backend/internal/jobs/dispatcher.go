package jobs

import (
	"context"
	"encoding/json"

	"github.com/hibiken/asynq"
)

// Dispatcher enqueues background jobs for long running tasks.
type Dispatcher struct {
	client *asynq.Client
}

// NewDispatcher creates a dispatcher from the provided redis options.
func NewDispatcher(client *asynq.Client) *Dispatcher {
	return &Dispatcher{client: client}
}

// EnqueueRunTask submits a level run request.
func (d *Dispatcher) EnqueueRunTask(ctx context.Context, payload any) (string, error) {
	body, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}
	task := asynq.NewTask("student:level:run", body)
	info, err := d.client.EnqueueContext(ctx, task)
	if err != nil {
		return "", err
	}
	return info.ID, nil
}
