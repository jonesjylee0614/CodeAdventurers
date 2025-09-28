package storage

import (
	"context"
	"database/sql"
	"strings"
	"time"

	"github.com/go-sql-driver/mysql"

	"github.com/codeadventurers/api-go/internal/platform/config"
)

// NewMySQL connects to the database using the provided configuration.
func NewMySQL(ctx context.Context, cfg config.MySQLConfig) (*sql.DB, error) {
	dsn := cfg.DSN
	if strings.HasPrefix(dsn, "mysql://") {
		parsed, err := mysql.ParseDSN(strings.TrimPrefix(dsn, "mysql://"))
		if err != nil {
			return nil, err
		}
		dsn = parsed.FormatDSN()
	}

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, err
	}

	db.SetMaxOpenConns(cfg.MaxOpenConns)
	db.SetMaxIdleConns(cfg.MaxIdleConns)
	db.SetConnMaxLifetime(cfg.ConnMaxLifetime)

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	if err := db.PingContext(ctx); err != nil {
		return nil, err
	}

	return db, nil
}
