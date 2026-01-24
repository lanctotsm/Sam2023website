package handler

import (
	"net/http"
	"time"

	"cms-backend/internal/store"

	"golang.org/x/oauth2"
)

type loginResponse struct {
	AuthURL string `json:"auth_url"`
}

func (a *API) handleLogin(w http.ResponseWriter, r *http.Request) {
	state, err := randomToken(16)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create oauth state")
		return
	}

	if err := a.store.OAuth.Insert(r.Context(), state); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to persist oauth state")
		return
	}

	authURL := a.oauth.Config.AuthCodeURL(state, oauth2.AccessTypeOffline)
	writeJSON(w, http.StatusOK, loginResponse{AuthURL: authURL})
}

func (a *API) handleCallback(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	state := r.URL.Query().Get("state")
	if code == "" || state == "" {
		writeError(w, http.StatusBadRequest, "missing code or state")
		return
	}

	validState, err := a.store.OAuth.Consume(r.Context(), state)
	if err != nil || !validState {
		writeError(w, http.StatusUnauthorized, "invalid oauth state")
		return
	}

	token, err := a.oauth.Exchange(r.Context(), code)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "oauth exchange failed")
		return
	}

	rawIDToken, ok := token.Extra("id_token").(string)
	if !ok || rawIDToken == "" {
		writeError(w, http.StatusUnauthorized, "missing id token")
		return
	}

	claims, err := a.oauth.VerifyIDToken(r.Context(), rawIDToken)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "invalid id token")
		return
	}

	user, err := a.store.Users.UpsertByGoogle(r.Context(), claims.GoogleID, claims.Email)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "user upsert failed")
		return
	}

	sessionToken, err := randomToken(32)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create session")
		return
	}

	session := store.Session{
		UserID:    user.ID,
		Token:     sessionToken,
		ExpiresAt: time.Now().Add(a.cfg.SessionDuration),
	}
	if err := a.store.Sessions.Create(r.Context(), session); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to persist session")
		return
	}

	a.setSessionCookie(w, sessionToken)
	writeJSON(w, http.StatusOK, map[string]any{
		"user": user,
	})
}

func (a *API) handleLogout(w http.ResponseWriter, r *http.Request) {
	token, _ := a.readSessionToken(r)
	if token != "" {
		_ = a.store.Sessions.DeleteByToken(r.Context(), token)
	}

	http.SetCookie(w, &http.Cookie{
		Name:     a.cfg.SessionCookieName,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   a.cfg.CookieSecure,
		SameSite: http.SameSiteLaxMode,
	})
	writeJSON(w, http.StatusOK, map[string]string{"status": "logged_out"})
}

func (a *API) handleStatus(w http.ResponseWriter, r *http.Request) {
	user := userFromContext(r.Context())
	if user == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"user": user})
}

func (a *API) readSessionToken(r *http.Request) (string, error) {
	cookie, err := r.Cookie(a.cfg.SessionCookieName)
	if err != nil {
		return "", err
	}
	return cookie.Value, nil
}

func (a *API) setSessionCookie(w http.ResponseWriter, token string) {
	http.SetCookie(w, &http.Cookie{
		Name:     a.cfg.SessionCookieName,
		Value:    token,
		Path:     "/",
		Expires:  time.Now().Add(a.cfg.SessionDuration),
		HttpOnly: true,
		Secure:   a.cfg.CookieSecure,
		SameSite: http.SameSiteLaxMode,
	})
}
