package store

import (
	"context"
	"database/sql"
	"errors"
	"time"
)

type Album struct {
	ID          int64
	Title       string
	Slug        string
	Description string
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

type AlbumStore struct {
	db *sql.DB
}

func (s *AlbumStore) Create(ctx context.Context, album Album) (*Album, error) {
	query := `
		INSERT INTO albums (title, slug, description)
		VALUES ($1, $2, $3)
		RETURNING id, title, slug, description, created_at, updated_at;
	`
	row := s.db.QueryRowContext(ctx, query, album.Title, album.Slug, album.Description)
	return scanAlbum(row)
}

func (s *AlbumStore) Update(ctx context.Context, id int64, album Album) (*Album, error) {
	query := `
		UPDATE albums
		SET title = $1,
			slug = $2,
			description = $3,
			updated_at = NOW()
		WHERE id = $4
		RETURNING id, title, slug, description, created_at, updated_at;
	`
	row := s.db.QueryRowContext(ctx, query, album.Title, album.Slug, album.Description, id)
	return scanAlbum(row)
}

func (s *AlbumStore) Delete(ctx context.Context, id int64) error {
	_, err := s.db.ExecContext(ctx, `DELETE FROM albums WHERE id = $1;`, id)
	return err
}

func (s *AlbumStore) List(ctx context.Context) ([]Album, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, title, slug, description, created_at, updated_at
		FROM albums ORDER BY created_at DESC;`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var albums []Album
	for rows.Next() {
		album, err := scanAlbum(rows)
		if err != nil {
			return nil, err
		}
		albums = append(albums, *album)
	}
	return albums, rows.Err()
}

func (s *AlbumStore) GetByID(ctx context.Context, id int64) (*Album, error) {
	row := s.db.QueryRowContext(ctx, `
		SELECT id, title, slug, description, created_at, updated_at
		FROM albums WHERE id = $1;`, id)
	return scanAlbum(row)
}

func (s *AlbumStore) GetBySlug(ctx context.Context, slug string) (*Album, error) {
	row := s.db.QueryRowContext(ctx, `
		SELECT id, title, slug, description, created_at, updated_at
		FROM albums WHERE slug = $1;`, slug)
	return scanAlbum(row)
}

func scanAlbum(row interface {
	Scan(dest ...any) error
}) (*Album, error) {
	album := &Album{}
	err := row.Scan(
		&album.ID,
		&album.Title,
		&album.Slug,
		&album.Description,
		&album.CreatedAt,
		&album.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return album, nil
}
