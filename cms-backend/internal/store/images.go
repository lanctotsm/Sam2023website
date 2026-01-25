package store

import (
	"context"
	"database/sql"
	"errors"
	"time"
)

type Image struct {
	ID        int64     `json:"id"`
	S3Key     string    `json:"s3_key"`
	Width     *int      `json:"width"`
	Height    *int      `json:"height"`
	Caption   string    `json:"caption"`
	AltText   string    `json:"alt_text"`
	CreatedBy *int64    `json:"created_by,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

type ImageStore struct {
	db *sql.DB
}

func (s *ImageStore) Create(ctx context.Context, image Image, userID *int64) (*Image, error) {
	query := `
		INSERT INTO images (s3_key, width, height, caption, alt_text, created_by)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, s3_key, width, height, caption, alt_text, created_by, created_at;
	`
	row := s.db.QueryRowContext(ctx, query, image.S3Key, image.Width, image.Height, image.Caption, image.AltText, userID)
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
		RETURNING id, s3_key, width, height, caption, alt_text, created_by, created_at;
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
		SELECT id, s3_key, width, height, caption, alt_text, created_by, created_at
		FROM images ORDER BY created_at DESC;`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	images := []Image{}
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
		SELECT id, s3_key, width, height, caption, alt_text, created_by, created_at
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
		&image.CreatedBy,
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
