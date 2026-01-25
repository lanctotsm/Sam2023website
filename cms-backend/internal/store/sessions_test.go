package store

import (
	"context"
	"database/sql"
	"regexp"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
)

func TestSessionStoreCreate(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock init: %v", err)
	}
	defer db.Close()

	store := &SessionStore{db: db}
	expiresAt := time.Now().Add(24 * time.Hour)

	mock.ExpectExec(regexp.QuoteMeta(`
		INSERT INTO sessions (user_id, token, expires_at)
		VALUES ($1, $2, $3);
	`)).
		WithArgs(int64(1), "token123", expiresAt).
		WillReturnResult(sqlmock.NewResult(1, 1))

	session := Session{
		UserID:    1,
		Token:     "token123",
		ExpiresAt: expiresAt,
	}

	err = store.Create(context.Background(), session)
	if err != nil {
		t.Fatalf("create session: %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestSessionStoreGetByToken(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock init: %v", err)
	}
	defer db.Close()

	store := &SessionStore{db: db}
	now := time.Now()
	expiresAt := now.Add(24 * time.Hour)
	rows := sqlmock.NewRows([]string{
		"id", "user_id", "token", "expires_at", "created_at",
	}).AddRow(1, 1, "token123", expiresAt, now)

	mock.ExpectQuery(regexp.QuoteMeta(`
		SELECT id, user_id, token, expires_at, created_at
		FROM sessions
		WHERE token = $1;
	`)).
		WithArgs("token123").
		WillReturnRows(rows)

	session, err := store.GetByToken(context.Background(), "token123")
	if err != nil {
		t.Fatalf("get session: %v", err)
	}
	if session == nil || session.ID != 1 {
		t.Fatalf("expected session ID 1, got %#v", session)
	}
	if session.Token != "token123" {
		t.Fatalf("unexpected token: %s", session.Token)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestSessionStoreGetByTokenNotFound(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock init: %v", err)
	}
	defer db.Close()

	store := &SessionStore{db: db}
	mock.ExpectQuery(regexp.QuoteMeta(`
		SELECT id, user_id, token, expires_at, created_at
		FROM sessions
		WHERE token = $1;
	`)).
		WithArgs("invalid").
		WillReturnError(sql.ErrNoRows)

	session, err := store.GetByToken(context.Background(), "invalid")
	if err != nil {
		t.Fatalf("get session should not error: %v", err)
	}
	if session != nil {
		t.Fatalf("expected nil session, got %#v", session)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestSessionStoreDeleteByToken(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock init: %v", err)
	}
	defer db.Close()

	store := &SessionStore{db: db}
	mock.ExpectExec(regexp.QuoteMeta(`DELETE FROM sessions WHERE token = $1;`)).
		WithArgs("token123").
		WillReturnResult(sqlmock.NewResult(0, 1))

	err = store.DeleteByToken(context.Background(), "token123")
	if err != nil {
		t.Fatalf("delete session: %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestSessionStoreDeleteExpired(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock init: %v", err)
	}
	defer db.Close()

	store := &SessionStore{db: db}
	mock.ExpectExec(regexp.QuoteMeta(`DELETE FROM sessions WHERE expires_at < NOW();`)).
		WillReturnResult(sqlmock.NewResult(0, 2))

	err = store.DeleteExpired(context.Background())
	if err != nil {
		t.Fatalf("delete expired: %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}
