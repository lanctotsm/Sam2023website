package handler

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"cms-backend/internal/config"
	"cms-backend/internal/store"

	"github.com/DATA-DOG/go-sqlmock"
)

func TestRequireAuth(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock init: %v", err)
	}
	defer db.Close()

	cfg := config.Config{
		SessionCookieName: "cms_session",
		CookieSecure:       false,
	}
	stores := store.New(db)
	api := &API{
		cfg:   cfg,
		store: stores,
	}

	expiresAt := time.Now().Add(24 * time.Hour)
	sessionRows := sqlmock.NewRows([]string{
		"id", "user_id", "token", "expires_at", "created_at",
	}).AddRow(1, 1, "valid-token", expiresAt, time.Now())

	userRows := sqlmock.NewRows([]string{
		"id", "google_id", "email", "role", "created_at",
	}).AddRow(1, "google123", "test@example.com", "admin", time.Now())

	mock.ExpectQuery(`SELECT id, user_id, token, expires_at, created_at`).
		WillReturnRows(sessionRows)
	mock.ExpectQuery(`SELECT id, google_id, email, role, created_at`).
		WillReturnRows(userRows)

	handler := api.requireAuth(func(w http.ResponseWriter, r *http.Request) {
		user := userFromContext(r.Context())
		if user == nil {
			t.Fatal("expected user in context")
		}
		if user.Email != "test@example.com" {
			t.Fatalf("expected email 'test@example.com', got %s", user.Email)
		}
		w.WriteHeader(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.AddCookie(&http.Cookie{
		Name:  "cms_session",
		Value: "valid-token",
	})
	w := httptest.NewRecorder()

	handler(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", w.Code)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestRequireAuthMissingToken(t *testing.T) {
	db, _, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock init: %v", err)
	}
	defer db.Close()

	cfg := config.Config{
		SessionCookieName: "cms_session",
		CookieSecure:       false,
	}
	stores := store.New(db)
	api := &API{
		cfg:   cfg,
		store: stores,
	}

	handler := api.requireAuth(func(w http.ResponseWriter, r *http.Request) {
		t.Fatal("handler should not be called")
	})

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	w := httptest.NewRecorder()

	handler(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected status 401, got %d", w.Code)
	}
}

func TestWithOptionalAuth(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock init: %v", err)
	}
	defer db.Close()

	cfg := config.Config{
		SessionCookieName: "cms_session",
		CookieSecure:       false,
	}
	stores := store.New(db)
	api := &API{
		cfg:   cfg,
		store: stores,
	}

	expiresAt := time.Now().Add(24 * time.Hour)
	sessionRows := sqlmock.NewRows([]string{
		"id", "user_id", "token", "expires_at", "created_at",
	}).AddRow(1, 1, "valid-token", expiresAt, time.Now())

	userRows := sqlmock.NewRows([]string{
		"id", "google_id", "email", "role", "created_at",
	}).AddRow(1, "google123", "test@example.com", "admin", time.Now())

	mock.ExpectQuery(`SELECT id, user_id, token, expires_at, created_at`).
		WillReturnRows(sessionRows)
	mock.ExpectQuery(`SELECT id, google_id, email, role, created_at`).
		WillReturnRows(userRows)

	called := false
	handler := api.withOptionalAuth(func(w http.ResponseWriter, r *http.Request) {
		called = true
		user := userFromContext(r.Context())
		if user == nil {
			t.Fatal("expected user in context")
		}
		w.WriteHeader(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.AddCookie(&http.Cookie{
		Name:  "cms_session",
		Value: "valid-token",
	})
	w := httptest.NewRecorder()

	handler(w, req)

	if !called {
		t.Fatal("handler should be called")
	}
	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", w.Code)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestWithOptionalAuthNoToken(t *testing.T) {
	db, _, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock init: %v", err)
	}
	defer db.Close()

	cfg := config.Config{
		SessionCookieName: "cms_session",
		CookieSecure:       false,
	}
	stores := store.New(db)
	api := &API{
		cfg:   cfg,
		store: stores,
	}

	called := false
	handler := api.withOptionalAuth(func(w http.ResponseWriter, r *http.Request) {
		called = true
		user := userFromContext(r.Context())
		if user != nil {
			t.Fatal("expected nil user")
		}
		w.WriteHeader(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	w := httptest.NewRecorder()

	handler(w, req)

	if !called {
		t.Fatal("handler should be called")
	}
	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", w.Code)
	}
}

func TestUserFromContext(t *testing.T) {
	user := &store.User{
		ID:    1,
		Email: "test@example.com",
	}
	ctx := context.WithValue(context.Background(), userKey, user)

	result := userFromContext(ctx)
	if result == nil {
		t.Fatal("expected user from context")
	}
	if result.Email != "test@example.com" {
		t.Fatalf("expected email 'test@example.com', got %s", result.Email)
	}
}

func TestUserFromContextNil(t *testing.T) {
	result := userFromContext(context.Background())
	if result != nil {
		t.Fatalf("expected nil user, got %#v", result)
	}
}
