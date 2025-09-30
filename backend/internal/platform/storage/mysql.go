package storage

import (
	"context"
	"strings"
	"time"

	"github.com/go-sql-driver/mysql"
	gormmysql "gorm.io/driver/mysql"
	"gorm.io/gorm"

	"github.com/codeadventurers/api-go/internal/platform/config"
)

// NewMySQL connects to the database using GORM with the provided configuration.
func NewMySQL(ctx context.Context, cfg config.MySQLConfig) (*gorm.DB, error) {
	dsn := cfg.DSN
	if strings.HasPrefix(dsn, "mysql://") {
		parsed, err := mysql.ParseDSN(strings.TrimPrefix(dsn, "mysql://"))
		if err != nil {
			return nil, err
		}
		dsn = parsed.FormatDSN()
	}

	db, err := gorm.Open(gormmysql.Open(dsn), &gorm.Config{
		// Optimize for production
		PrepareStmt: true,
		// Log SQL in development
		// Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, err
	}

	// Get underlying sql.DB to set connection pool settings
	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}

	sqlDB.SetMaxOpenConns(cfg.MaxOpenConns)
	sqlDB.SetMaxIdleConns(cfg.MaxIdleConns)
	sqlDB.SetConnMaxLifetime(cfg.ConnMaxLifetime)

	// Test connection
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	if err := sqlDB.PingContext(ctx); err != nil {
		return nil, err
	}

	return db, nil
}
