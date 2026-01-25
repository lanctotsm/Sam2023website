package store

import "database/sql"

type Store struct {
	Users        *UserStore
	Sessions     *SessionStore
	Posts        *PostStore
	Albums       *AlbumStore
	Images       *ImageStore
	Links        *LinkStore
	OAuth        *OAuthStateStore
	AllowedEmails *AllowedEmailStore
}

func New(db *sql.DB) *Store {
	return &Store{
		Users:         &UserStore{db: db},
		Sessions:      &SessionStore{db: db},
		Posts:         &PostStore{db: db},
		Albums:        &AlbumStore{db: db},
		Images:        &ImageStore{db: db},
		Links:         &LinkStore{db: db},
		OAuth:         &OAuthStateStore{db: db},
		AllowedEmails: &AllowedEmailStore{db: db},
	}
}
