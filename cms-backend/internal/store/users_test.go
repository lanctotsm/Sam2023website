package store

import (
	"context"
	"database/sql"
	"regexp"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
)

func TestUserStoreUpsertByGoogle(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock init: %v", err)
	}
	defer db.Close()

	store := &UserStore{db: db}
	now := time.Now()
	rows := sqlmock.NewRows([]string{
		"id", "google_id", "email", "role", "created_at",
	}).AddRow(1, "google123", "test@example.com", "admin", now)

	mock.ExpectQuery(regexp.QuoteMeta(`
		INSERT INTO users (google_id, email, role)
		VALUES ($1, $2, 'admin')
		ON CONFLICT (google_id)
		DO UPDATE SET email = EXCLUDED.email
		RETURNING id, google_id, email, role, created_at;
	`)).
		WithArgs("google123", "test@example.com").
		WillReturnRows(rows)

	user, err := store.UpsertByGoogle(context.Background(), "google123", "test@example.com")
	if err != nil {
		t.Fatalf("upsert user: %v", err)
	}
	if user == nil || user.ID != 1 {
		t.Fatalf("expected user ID 1, got %#v", user)
	}
	if user.GoogleID != "google123" || user.Email != "test@example.com" {
		t.Fatalf("unexpected user data: %#v", user)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestUserStoreGetByID(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock init: %v", err)
	}
	defer db.Close()

	store := &UserStore{db: db}
	now := time.Now()
	rows := sqlmock.NewRows([]string{
		"id", "google_id", "email", "role", "created_at",
	}).AddRow(1, "google123", "test@example.com", "admin", now)

	mock.ExpectQuery(regexp.QuoteMeta(`SELECT id, google_id, email, role, created_at FROM users WHERE id = $1;`)).
		WithArgs(int64(1)).
		WillReturnRows(rows)

	user, err := store.GetByID(context.Background(), 1)
	if err != nil {
		t.Fatalf("get user: %v", err)
	}
	if user == nil || user.ID != 1 {
		t.Fatalf("expected user ID 1, got %#v", user)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestUserStoreGetByIDNotFound(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock init: %v", err)
	}
	defer db.Close()

	store := &UserStore{db: db}
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT id, google_id, email, role, created_at FROM users WHERE id = $1;`)).
		WithArgs(int64(999)).
		WillReturnError(sql.ErrNoRows)

	user, err := store.GetByID(context.Background(), 999)
	if err != nil {
		t.Fatalf("get user should not error: %v", err)
	}
	if user != nil {
		t.Fatalf("expected nil user, got %#v", user)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}
