package db

import (
	"context"
	"database/sql"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
)

func Open(ctx context.Context, databaseURL string) (*sql.DB, error) {
	db, err := sql.Open("pgx", databaseURL)
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(30 * time.Minute)

	// Retry connection with exponential backoff (for Docker Compose startup)
	maxRetries := 10
	retryDelay := 1 * time.Second
	for i := 0; i < maxRetries; i++ {
		if err := db.PingContext(ctx); err == nil {
			return db, nil
		}
		if i < maxRetries-1 {
			time.Sleep(retryDelay)
			retryDelay *= 2
		}
	}

	// Final attempt - return error if still failing
	if err := db.PingContext(ctx); err != nil {
		return nil, err
	}

	return db, nil
}
