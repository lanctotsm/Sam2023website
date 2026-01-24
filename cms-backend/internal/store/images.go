package store

import (
	"context"
	"database/sql"
	"errors"
	"time"
)

type Image struct {
	ID        int64
	S3Key     string
	Width     *int
	Height    *int
	Caption   string
	AltText   string
	CreatedAt time.Time
}

type ImageStore struct {
	db *sql.DB
}

func (s *ImageStore) Create(ctx context.Context, image Image) (*Image, error) {
	query := `
		INSERT INTO images (s3_key, width, height, caption, alt_text)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, s3_key, width, height, caption, alt_text, created_at;
	`
	row := s.db.QueryRowContext(ctx, query, image.S3Key, image.Width, image.Height, image.Caption, image.AltText)
	return scanImage(row)
}

func (s *ImageStore) Update(ctx context.Context, id int64, image Image) (*Image, error) {
	query := `
		UPDATE images
		SET s3_key = $1,
			width = $2,
			height = $3,
			caption = $4,
			alt_text = $5
		WHERE id = $6
		RETURNING id, s3_key, width, height, caption, alt_text, created_at;
	`
	row := s.db.QueryRowContext(ctx, query, image.S3Key, image.Width, image.Height, image.Caption, image.AltText, id)
	return scanImage(row)
}

func (s *ImageStore) Delete(ctx context.Context, id int64) error {
	_, err := s.db.ExecContext(ctx, `DELETE FROM images WHERE id = $1;`, id)
	return err
}

func (s *ImageStore) List(ctx context.Context) ([]Image, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, s3_key, width, height, caption, alt_text, created_at
		FROM images ORDER BY created_at DESC;`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var images []Image
	for rows.Next() {
		image, err := scanImage(rows)
		if err != nil {
			return nil, err
		}
		images = append(images, *image)
	}
	return images, rows.Err()
}

func (s *ImageStore) GetByID(ctx context.Context, id int64) (*Image, error) {
	row := s.db.QueryRowContext(ctx, `
		SELECT id, s3_key, width, height, caption, alt_text, created_at
		FROM images WHERE id = $1;`, id)
	return scanImage(row)
}

func scanImage(row interface {
	Scan(dest ...any) error
}) (*Image, error) {
	image := &Image{}
	err := row.Scan(
		&image.ID,
		&image.S3Key,
		&image.Width,
		&image.Height,
		&image.Caption,
		&image.AltText,
		&image.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return image, nil
}
