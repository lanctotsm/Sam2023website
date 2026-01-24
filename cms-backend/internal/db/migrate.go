package db

import (
	"context"
	"database/sql"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"
)

func RunMigrations(ctx context.Context, db *sql.DB, migrationsDir string) error {
	if err := ensureSchemaTable(ctx, db); err != nil {
		return err
	}

	files, err := os.ReadDir(migrationsDir)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}

	var migrations []fs.DirEntry
	for _, file := range files {
		if file.IsDir() || !strings.HasSuffix(file.Name(), ".sql") {
			continue
		}
		migrations = append(migrations, file)
	}

	sort.Slice(migrations, func(i, j int) bool {
		return migrations[i].Name() < migrations[j].Name()
	})

	for _, migration := range migrations {
		version := migration.Name()
		applied, err := hasMigration(ctx, db, version)
		if err != nil {
			return err
		}
		if applied {
			continue
		}

		path := filepath.Join(migrationsDir, migration.Name())
		contents, err := os.ReadFile(path)
		if err != nil {
			return err
		}

		if _, err := db.ExecContext(ctx, string(contents)); err != nil {
			return fmt.Errorf("migration %s failed: %w", version, err)
		}

		if err := recordMigration(ctx, db, version); err != nil {
			return err
		}
	}

	return nil
}

func ensureSchemaTable(ctx context.Context, db *sql.DB) error {
	query := `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version TEXT PRIMARY KEY,
			applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);`
	_, err := db.ExecContext(ctx, query)
	return err
}

func hasMigration(ctx context.Context, db *sql.DB, version string) (bool, error) {
	var exists bool
	query := `SELECT EXISTS (SELECT 1 FROM schema_migrations WHERE version = $1);`
	err := db.QueryRowContext(ctx, query, version).Scan(&exists)
	return exists, err
}

func recordMigration(ctx context.Context, db *sql.DB, version string) error {
	query := `INSERT INTO schema_migrations (version, applied_at) VALUES ($1, $2);`
	_, err := db.ExecContext(ctx, query, version, time.Now())
	return err
}
