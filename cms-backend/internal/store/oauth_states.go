package store

import (
	"context"
	"database/sql"
)

type OAuthStateStore struct {
	db *sql.DB
}

func (s *OAuthStateStore) Insert(ctx context.Context, state string) error {
	_, err := s.db.ExecContext(ctx, `INSERT INTO oauth_states (state) VALUES ($1);`, state)
	return err
}

func (s *OAuthStateStore) Consume(ctx context.Context, state string) (bool, error) {
	result, err := s.db.ExecContext(ctx, `DELETE FROM oauth_states WHERE state = $1;`, state)
	if err != nil {
		return false, err
	}
	affected, err := result.RowsAffected()
	if err != nil {
		return false, err
	}
	return affected > 0, nil
}
