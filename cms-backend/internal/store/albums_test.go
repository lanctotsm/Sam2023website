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
	rows := sqlmock.NewRows([]string{
		"id", "title", "slug", "description", "created_at", "updated_at",
	}).AddRow(2, "Album", "album", "Desc", now, now)

	mock.ExpectQuery(regexp.QuoteMeta(`
		INSERT INTO albums (title, slug, description)
		VALUES ($1, $2, $3)
		RETURNING id, title, slug, description, created_at, updated_at;
	`)).
		WithArgs("Album", "album", "Desc").
		WillReturnRows(rows)

	created, err := store.Create(context.Background(), Album{
		Title:       "Album",
		Slug:        "album",
		Description: "Desc",
	})
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
