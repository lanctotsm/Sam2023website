package handler

import (
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
)

func (a *API) handleListAdminUsers(w http.ResponseWriter, r *http.Request) {
	emails, err := a.store.AllowedEmails.List(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list admin users")
		return
	}
	writeJSON(w, http.StatusOK, emails)
}

func (a *API) handleAddAdminUser(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		Email string `json:"email"`
	}
	if err := readJSON(r, &payload); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	email := strings.TrimSpace(payload.Email)
	if email == "" {
		writeError(w, http.StatusBadRequest, "email is required")
		return
	}

	created, err := a.store.AllowedEmails.Create(r.Context(), email, false)
	if err != nil {
		if strings.Contains(err.Error(), "unique constraint") || strings.Contains(err.Error(), "duplicate") {
			writeError(w, http.StatusConflict, "admin user already exists")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to add admin user")
		return
	}

	writeJSON(w, http.StatusCreated, created)
}

func (a *API) handleRemoveAdminUser(w http.ResponseWriter, r *http.Request) {
	userID, err := parseID(chi.URLParam(r, "userID"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid user id")
		return
	}

	if err := a.store.AllowedEmails.Delete(r.Context(), userID); err != nil {
		if strings.Contains(err.Error(), "base admin") {
			writeError(w, http.StatusForbidden, "cannot remove base admin user")
			return
		}
		if strings.Contains(err.Error(), "not found") {
			writeError(w, http.StatusNotFound, "admin user not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to remove admin user")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "removed"})
}
