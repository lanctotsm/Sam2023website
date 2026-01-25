package store

import (
	"context"
	"regexp"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
)

func TestAlbumStoreCreate(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock init: %v", err)
	}
	defer db.Close()

	store := &AlbumStore{db: db}
	now := time.Now()
	userID := int64(1)
	rows := sqlmock.NewRows([]string{
		"id", "title", "slug", "description", "created_by", "created_at", "updated_at",
	}).AddRow(2, "Album", "album", "Desc", userID, now, now)

	mock.ExpectQuery(regexp.QuoteMeta(`
		INSERT INTO albums (title, slug, description, created_by)
		VALUES ($1, $2, $3, $4)
		RETURNING id, title, slug, description, created_by, created_at, updated_at;
	`)).
		WithArgs("Album", "album", "Desc", &userID).
		WillReturnRows(rows)

	created, err := store.Create(context.Background(), Album{
		Title:       "Album",
		Slug:        "album",
		Description: "Desc",
	}, &userID)
	if err != nil {
		t.Fatalf("create album: %v", err)
	}
	if created == nil || created.ID != 2 {
		t.Fatalf("expected album ID 2, got %#v", created)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}
