package store

import (
	"context"
	"database/sql"
	"errors"
	"time"
)

type User struct {
	ID        int64     `json:"id"`
	GoogleID  string    `json:"google_id,omitempty"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}

type UserStore struct {
	db *sql.DB
}

func (s *UserStore) UpsertByGoogle(ctx context.Context, googleID, email string) (*User, error) {
	query := `
		INSERT INTO users (google_id, email, role)
		VALUES ($1, $2, 'admin')
		ON CONFLICT (google_id)
		DO UPDATE SET email = EXCLUDED.email
		RETURNING id, google_id, email, role, created_at;
	`
	user := &User{}
	if err := s.db.QueryRowContext(ctx, query, googleID, email).Scan(
		&user.ID, &user.GoogleID, &user.Email, &user.Role, &user.CreatedAt,
	); err != nil {
		return nil, err
	}
	return user, nil
}

func (s *UserStore) GetByID(ctx context.Context, id int64) (*User, error) {
	query := `SELECT id, google_id, email, role, created_at FROM users WHERE id = $1;`
	user := &User{}
	if err := s.db.QueryRowContext(ctx, query, id).Scan(
		&user.ID, &user.GoogleID, &user.Email, &user.Role, &user.CreatedAt,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return user, nil
}
