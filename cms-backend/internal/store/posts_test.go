package store

import (
	"context"
	"regexp"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
)

func TestPostStoreCreate(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock init: %v", err)
	}
	defer db.Close()

	store := &PostStore{db: db}
	now := time.Now()
	userID := int64(1)
	rows := sqlmock.NewRows([]string{
		"id", "title", "slug", "summary", "markdown", "status", "published_at", "created_by", "created_at", "updated_at",
	}).AddRow(1, "Title", "title", "Summary", "Body", "draft", nil, userID, now, now)

	mock.ExpectQuery(regexp.QuoteMeta(`
		INSERT INTO posts (title, slug, summary, markdown, status, published_at, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, title, slug, summary, markdown, status, published_at, created_by, created_at, updated_at;
	`)).
		WithArgs("Title", "title", "Summary", "Body", "draft", (*time.Time)(nil), &userID).
		WillReturnRows(rows)

	created, err := store.Create(context.Background(), Post{
		Title:    "Title",
		Slug:     "title",
		Summary:  "Summary",
		Markdown: "Body",
		Status:   "draft",
	}, &userID)
	if err != nil {
		t.Fatalf("create post: %v", err)
	}
	if created == nil || created.ID != 1 {
		t.Fatalf("expected post ID 1, got %#v", created)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}
