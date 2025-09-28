package telemetry

import (
	"context"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.26.0"
	oteltrace "go.opentelemetry.io/otel/trace"
)

// Provider bundles the OpenTelemetry tracer provider and a shutdown function.
type Provider struct {
	TracerProvider oteltrace.TracerProvider
	Shutdown       func(context.Context) error
}

// Setup initialises a TracerProvider. When endpoint is empty a noop provider is returned.
func Setup(ctx context.Context, serviceName, endpoint string) (*Provider, error) {
	if endpoint == "" {
		return &Provider{TracerProvider: oteltrace.NewNoopTracerProvider(), Shutdown: func(context.Context) error { return nil }}, nil
	}
	exporter, err := otlptracegrpc.New(ctx, otlptracegrpc.WithEndpoint(endpoint), otlptracegrpc.WithInsecure())
	if err != nil {
		return nil, err
	}

	provider := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exporter),
		sdktrace.WithResource(resource.NewWithAttributes(
			semconv.SchemaURL,
			semconv.ServiceNameKey.String(serviceName),
		)),
	)

	otel.SetTracerProvider(provider)

	return &Provider{TracerProvider: provider, Shutdown: provider.Shutdown}, nil
}
