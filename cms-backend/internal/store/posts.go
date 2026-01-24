package store

import (
	"context"
	"database/sql"
	"errors"
	"time"
)

type Post struct {
	ID          int64
	Title       string
	Slug        string
	Summary     string
	Markdown    string
	Status      string
	PublishedAt *time.Time
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

type PostStore struct {
	db *sql.DB
}

func (s *PostStore) Create(ctx context.Context, post Post) (*Post, error) {
	query := `
		INSERT INTO posts (title, slug, summary, markdown, status, published_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, title, slug, summary, markdown, status, published_at, created_at, updated_at;
	`
	row := s.db.QueryRowContext(ctx, query, post.Title, post.Slug, post.Summary, post.Markdown, post.Status, post.PublishedAt)
	return scanPost(row)
}

func (s *PostStore) Update(ctx context.Context, id int64, post Post) (*Post, error) {
	query := `
		UPDATE posts
		SET title = $1,
			slug = $2,
			summary = $3,
			markdown = $4,
			status = $5,
			published_at = $6,
			updated_at = NOW()
		WHERE id = $7
		RETURNING id, title, slug, summary, markdown, status, published_at, created_at, updated_at;
	`
	row := s.db.QueryRowContext(ctx, query, post.Title, post.Slug, post.Summary, post.Markdown, post.Status, post.PublishedAt, id)
	return scanPost(row)
}

func (s *PostStore) Delete(ctx context.Context, id int64) error {
	_, err := s.db.ExecContext(ctx, `DELETE FROM posts WHERE id = $1;`, id)
	return err
}

func (s *PostStore) List(ctx context.Context, status string) ([]Post, error) {
	query := `SELECT id, title, slug, summary, markdown, status, published_at, created_at, updated_at FROM posts`
	var args []any
	if status != "" {
		query += ` WHERE status = $1`
		args = append(args, status)
	}
	query += ` ORDER BY created_at DESC;`

	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []Post
	for rows.Next() {
		post, err := scanPost(rows)
		if err != nil {
			return nil, err
		}
		posts = append(posts, *post)
	}
	return posts, rows.Err()
}

func (s *PostStore) GetByID(ctx context.Context, id int64) (*Post, error) {
	row := s.db.QueryRowContext(ctx, `
		SELECT id, title, slug, summary, markdown, status, published_at, created_at, updated_at
		FROM posts WHERE id = $1;`, id)
	return scanPost(row)
}

func (s *PostStore) GetBySlug(ctx context.Context, slug string) (*Post, error) {
	row := s.db.QueryRowContext(ctx, `
		SELECT id, title, slug, summary, markdown, status, published_at, created_at, updated_at
		FROM posts WHERE slug = $1;`, slug)
	return scanPost(row)
}

func scanPost(row interface {
	Scan(dest ...any) error
}) (*Post, error) {
	post := &Post{}
	err := row.Scan(
		&post.ID,
		&post.Title,
		&post.Slug,
		&post.Summary,
		&post.Markdown,
		&post.Status,
		&post.PublishedAt,
		&post.CreatedAt,
		&post.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return post, nil
}
