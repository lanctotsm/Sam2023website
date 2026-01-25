package handler

import (
	"context"
	"net/http"
	"time"

	"cms-backend/internal/store"
)

type contextKey string

const userKey contextKey = "user"

func (a *API) withOptionalAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		token, err := a.readSessionToken(r)
		if err != nil || token == "" {
			next(w, r)
			return
		}

		session, err := a.store.Sessions.GetByToken(r.Context(), token)
		if err != nil || session == nil || session.ExpiresAt.Before(time.Now()) {
			next(w, r)
			return
		}

		user, err := a.store.Users.GetByID(r.Context(), session.UserID)
		if err != nil || user == nil {
			next(w, r)
			return
		}

		ctx := context.WithValue(r.Context(), userKey, user)
		next(w, r.WithContext(ctx))
	}
}

func (a *API) requireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		token, err := a.readSessionToken(r)
		if err != nil || token == "" {
			writeError(w, http.StatusUnauthorized, "missing session token")
			return
		}

		session, err := a.store.Sessions.GetByToken(r.Context(), token)
		if err != nil || session == nil {
			writeError(w, http.StatusUnauthorized, "invalid session")
			return
		}
		if session.ExpiresAt.Before(time.Now()) {
			writeError(w, http.StatusUnauthorized, "session expired")
			return
		}

		user, err := a.store.Users.GetByID(r.Context(), session.UserID)
		if err != nil || user == nil {
			writeError(w, http.StatusUnauthorized, "user not found")
			return
		}

		ctx := context.WithValue(r.Context(), userKey, user)
		next(w, r.WithContext(ctx))
	}
}

func userFromContext(ctx context.Context) *store.User {
	value := ctx.Value(userKey)
	if value == nil {
		return nil
	}
	user, _ := value.(*store.User)
	return user
}
