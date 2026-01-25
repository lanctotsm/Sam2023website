package store

import (
	"context"
	"regexp"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
)

func TestOAuthStateStoreInsert(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock init: %v", err)
	}
	defer db.Close()

	store := &OAuthStateStore{db: db}
	mock.ExpectExec(regexp.QuoteMeta(`INSERT INTO oauth_states (state) VALUES ($1);`)).
		WithArgs("state123").
		WillReturnResult(sqlmock.NewResult(1, 1))

	err = store.Insert(context.Background(), "state123")
	if err != nil {
		t.Fatalf("insert state: %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestOAuthStateStoreConsume(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock init: %v", err)
	}
	defer db.Close()

	store := &OAuthStateStore{db: db}
	mock.ExpectExec(regexp.QuoteMeta(`DELETE FROM oauth_states WHERE state = $1;`)).
		WithArgs("state123").
		WillReturnResult(sqlmock.NewResult(0, 1))

	valid, err := store.Consume(context.Background(), "state123")
	if err != nil {
		t.Fatalf("consume state: %v", err)
	}
	if !valid {
		t.Fatalf("expected valid state, got false")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestOAuthStateStoreConsumeNotFound(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock init: %v", err)
	}
	defer db.Close()

	store := &OAuthStateStore{db: db}
	mock.ExpectExec(regexp.QuoteMeta(`DELETE FROM oauth_states WHERE state = $1;`)).
		WithArgs("invalid").
		WillReturnResult(sqlmock.NewResult(0, 0))

	valid, err := store.Consume(context.Background(), "invalid")
	if err != nil {
		t.Fatalf("consume state should not error: %v", err)
	}
	if valid {
		t.Fatalf("expected invalid state, got true")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}
