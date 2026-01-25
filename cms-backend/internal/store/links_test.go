package store

import (
	"context"
	"regexp"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
)

func TestLinkStoreLinkImageToAlbum(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock init: %v", err)
	}
	defer db.Close()

	store := &LinkStore{db: db}

	mock.ExpectExec(regexp.QuoteMeta(`
		INSERT INTO album_images (album_id, image_id, sort_order)
		VALUES ($1, $2, $3)
		ON CONFLICT (album_id, image_id)
		DO UPDATE SET sort_order = EXCLUDED.sort_order;`)).
		WithArgs(int64(1), int64(2), 5).
		WillReturnResult(sqlmock.NewResult(0, 1))

	if err := store.LinkImageToAlbum(context.Background(), 1, 2, 5); err != nil {
		t.Fatalf("link image: %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestLinkStoreListImagesForAlbum(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock init: %v", err)
	}
	defer db.Close()

	store := &LinkStore{db: db}
	now := time.Now()
	rows := sqlmock.NewRows([]string{
		"id", "s3_key", "width", "height", "caption", "alt_text", "created_at",
	}).AddRow(1, "uploads/one.jpg", 1200, 800, "One", "One alt", now).
		AddRow(2, "uploads/two.jpg", 800, 600, "Two", "Two alt", now)

	mock.ExpectQuery(regexp.QuoteMeta(`
		SELECT i.id, i.s3_key, i.width, i.height, i.caption, i.alt_text, i.created_at
		FROM images i
		INNER JOIN album_images ai ON ai.image_id = i.id
		WHERE ai.album_id = $1
		ORDER BY ai.sort_order ASC, i.created_at DESC;`)).
		WithArgs(int64(1)).
		WillReturnRows(rows)

	images, err := store.ListImagesForAlbum(context.Background(), 1)
	if err != nil {
		t.Fatalf("list images: %v", err)
	}
	if len(images) != 2 {
		t.Fatalf("expected 2 images, got %d", len(images))
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}
