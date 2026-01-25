package store

import (
	"context"
	"database/sql"
	"errors"
	"strings"
	"time"
)

type AllowedEmail struct {
	ID          int64     `json:"id"`
	Email       string    `json:"email"`
	IsBaseAdmin bool      `json:"is_base_admin"`
	CreatedAt   time.Time `json:"created_at"`
}

type AllowedEmailStore struct {
	db *sql.DB
}

func (s *AllowedEmailStore) IsAllowed(ctx context.Context, email string) (bool, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	var exists bool
	query := `SELECT EXISTS (SELECT 1 FROM allowed_emails WHERE email = $1);`
	err := s.db.QueryRowContext(ctx, query, email).Scan(&exists)
	return exists, err
}

func (s *AllowedEmailStore) List(ctx context.Context) ([]AllowedEmail, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, email, is_base_admin, created_at
		FROM allowed_emails
		ORDER BY is_base_admin DESC, created_at ASC;`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	emails := []AllowedEmail{}
	for rows.Next() {
		var email AllowedEmail
		if err := rows.Scan(&email.ID, &email.Email, &email.IsBaseAdmin, &email.CreatedAt); err != nil {
			return nil, err
		}
		emails = append(emails, email)
	}
	return emails, rows.Err()
}

func (s *AllowedEmailStore) Create(ctx context.Context, email string, isBaseAdmin bool) (*AllowedEmail, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	query := `
		INSERT INTO allowed_emails (email, is_base_admin)
		VALUES ($1, $2)
		RETURNING id, email, is_base_admin, created_at;
	`
	var result AllowedEmail
	err := s.db.QueryRowContext(ctx, query, email, isBaseAdmin).Scan(
		&result.ID, &result.Email, &result.IsBaseAdmin, &result.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &result, nil
}

func (s *AllowedEmailStore) Delete(ctx context.Context, id int64) error {
	// Prevent deletion of base admin
	var isBaseAdmin bool
	err := s.db.QueryRowContext(ctx, `SELECT is_base_admin FROM allowed_emails WHERE id = $1;`, id).Scan(&isBaseAdmin)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return errors.New("email not found")
		}
		return err
	}
	if isBaseAdmin {
		return errors.New("cannot delete base admin email")
	}

	_, err = s.db.ExecContext(ctx, `DELETE FROM allowed_emails WHERE id = $1;`, id)
	return err
}

func (s *AllowedEmailStore) EnsureBaseAdmin(ctx context.Context, email string) error {
	email = strings.ToLower(strings.TrimSpace(email))
	if email == "" {
		return nil // No base admin configured
	}

	// Check if base admin already exists
	var exists bool
	err := s.db.QueryRowContext(ctx, `
		SELECT EXISTS (SELECT 1 FROM allowed_emails WHERE is_base_admin = TRUE);
	`).Scan(&exists)
	if err != nil {
		return err
	}

	if !exists {
		// Insert base admin
		_, err = s.db.ExecContext(ctx, `
			INSERT INTO allowed_emails (email, is_base_admin)
			VALUES ($1, TRUE)
			ON CONFLICT (email) DO UPDATE SET is_base_admin = TRUE;
		`, email)
		return err
	}

	return nil
}
