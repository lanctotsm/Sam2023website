package handler

import (
	"net/http"
	"strings"

	"cms-backend/internal/store"

	"github.com/go-chi/chi/v5"
)

type albumRequest struct {
	Title       string `json:"title"`
	Slug        string `json:"slug"`
	Description string `json:"description"`
}

func (a *API) handleCreateAlbum(w http.ResponseWriter, r *http.Request) {
	var payload albumRequest
	if err := readJSON(r, &payload); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if strings.TrimSpace(payload.Title) == "" || strings.TrimSpace(payload.Slug) == "" {
		writeError(w, http.StatusBadRequest, "title and slug are required")
		return
	}

	album := store.Album{
		Title:       strings.TrimSpace(payload.Title),
		Slug:        strings.TrimSpace(payload.Slug),
		Description: strings.TrimSpace(payload.Description),
	}

	var userID *int64
	if user := userFromContext(r.Context()); user != nil {
		userID = &user.ID
	}

	created, err := a.store.Albums.Create(r.Context(), album, userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create album")
		return
	}

	writeJSON(w, http.StatusCreated, created)
}

func (a *API) handleListAlbums(w http.ResponseWriter, r *http.Request) {
	albums, err := a.store.Albums.List(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list albums")
		return
	}
	writeJSON(w, http.StatusOK, albums)
}

func (a *API) handleGetAlbum(w http.ResponseWriter, r *http.Request) {
	albumID, err := parseID(chi.URLParam(r, "albumID"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid album id")
		return
	}

	album, err := a.store.Albums.GetByID(r.Context(), albumID)
	if err != nil || album == nil {
		writeError(w, http.StatusNotFound, "album not found")
		return
	}
	writeJSON(w, http.StatusOK, album)
}

func (a *API) handleGetAlbumBySlug(w http.ResponseWriter, r *http.Request) {
	slug := strings.TrimSpace(chi.URLParam(r, "slug"))
	if slug == "" {
		writeError(w, http.StatusBadRequest, "missing slug")
		return
	}

	album, err := a.store.Albums.GetBySlug(r.Context(), slug)
	if err != nil || album == nil {
		writeError(w, http.StatusNotFound, "album not found")
		return
	}
	writeJSON(w, http.StatusOK, album)
}

func (a *API) handleUpdateAlbum(w http.ResponseWriter, r *http.Request) {
	albumID, err := parseID(chi.URLParam(r, "albumID"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid album id")
		return
	}

	var payload albumRequest
	if err := readJSON(r, &payload); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if strings.TrimSpace(payload.Title) == "" || strings.TrimSpace(payload.Slug) == "" {
		writeError(w, http.StatusBadRequest, "title and slug are required")
		return
	}

	album := store.Album{
		Title:       strings.TrimSpace(payload.Title),
		Slug:        strings.TrimSpace(payload.Slug),
		Description: strings.TrimSpace(payload.Description),
	}

	updated, err := a.store.Albums.Update(r.Context(), albumID, album)
	if err != nil || updated == nil {
		writeError(w, http.StatusNotFound, "album not found")
		return
	}

	writeJSON(w, http.StatusOK, updated)
}

func (a *API) handleDeleteAlbum(w http.ResponseWriter, r *http.Request) {
	albumID, err := parseID(chi.URLParam(r, "albumID"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid album id")
		return
	}

	if err := a.store.Albums.Delete(r.Context(), albumID); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to delete album")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}

func (a *API) handleLinkAlbumImage(w http.ResponseWriter, r *http.Request) {
	albumID, err := parseID(chi.URLParam(r, "albumID"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid album id")
		return
	}

	var payload struct {
		ImageID   int64 `json:"image_id"`
		SortOrder int   `json:"sort_order"`
	}
	if err := readJSON(r, &payload); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if payload.ImageID == 0 {
		writeError(w, http.StatusBadRequest, "image_id is required")
		return
	}

	if err := a.store.Links.LinkImageToAlbum(r.Context(), albumID, payload.ImageID, payload.SortOrder); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to link image")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "linked"})
}

func (a *API) handleListAlbumImages(w http.ResponseWriter, r *http.Request) {
	albumID, err := parseID(chi.URLParam(r, "albumID"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid album id")
		return
	}

	images, err := a.store.Links.ListImagesForAlbum(r.Context(), albumID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list images")
		return
	}

	writeJSON(w, http.StatusOK, images)
}
