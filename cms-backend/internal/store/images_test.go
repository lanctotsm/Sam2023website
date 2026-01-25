package store

import (
	"context"
	"regexp"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
)

func TestImageStoreCreate(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock init: %v", err)
	}
	defer db.Close()

	store := &ImageStore{db: db}
	now := time.Now()
	width := 1600
	height := 1067
	userID := int64(1)

	rows := sqlmock.NewRows([]string{
		"id", "s3_key", "width", "height", "caption", "alt_text", "created_by", "created_at",
	}).AddRow(3, "uploads/sample.jpg", width, height, "Caption", "Alt text", userID, now)

	mock.ExpectQuery(regexp.QuoteMeta(`
		INSERT INTO images (s3_key, width, height, caption, alt_text, created_by)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, s3_key, width, height, caption, alt_text, created_by, created_at;
	`)).
		WithArgs("uploads/sample.jpg", &width, &height, "Caption", "Alt text", &userID).
		WillReturnRows(rows)

	created, err := store.Create(context.Background(), Image{
		S3Key:   "uploads/sample.jpg",
		Width:   &width,
		Height:  &height,
		Caption: "Caption",
		AltText: "Alt text",
	}, &userID)
	if err != nil {
		t.Fatalf("create image: %v", err)
	}
	if created == nil || created.ID != 3 {
		t.Fatalf("expected image ID 3, got %#v", created)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}
