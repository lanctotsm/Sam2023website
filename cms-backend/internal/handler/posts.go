package handler

import (
	"net/http"
	"strings"
	"time"

	"cms-backend/internal/store"

	"github.com/go-chi/chi/v5"
)

type postRequest struct {
	Title       string     `json:"title"`
	Slug        string     `json:"slug"`
	Summary     string     `json:"summary"`
	Markdown    string     `json:"markdown"`
	Status      string     `json:"status"`
	PublishedAt *time.Time `json:"published_at"`
}

func (a *API) handleCreatePost(w http.ResponseWriter, r *http.Request) {
	var payload postRequest
	if err := readJSON(r, &payload); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if strings.TrimSpace(payload.Title) == "" || strings.TrimSpace(payload.Slug) == "" || strings.TrimSpace(payload.Markdown) == "" {
		writeError(w, http.StatusBadRequest, "title, slug, and markdown are required")
		return
	}

	status := normalizeStatus(payload.Status)
	post := store.Post{
		Title:       strings.TrimSpace(payload.Title),
		Slug:        strings.TrimSpace(payload.Slug),
		Summary:     strings.TrimSpace(payload.Summary),
		Markdown:    payload.Markdown,
		Status:      status,
		PublishedAt: payload.PublishedAt,
	}

	created, err := a.store.Posts.Create(r.Context(), post)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create post")
		return
	}

	writeJSON(w, http.StatusCreated, created)
}

func (a *API) handleListPosts(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	if userFromContext(r.Context()) == nil {
		status = "published"
	}

	posts, err := a.store.Posts.List(r.Context(), status)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list posts")
		return
	}

	writeJSON(w, http.StatusOK, posts)
}

func (a *API) handleGetPost(w http.ResponseWriter, r *http.Request) {
	postID, err := parseID(chi.URLParam(r, "postID"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid post id")
		return
	}

	post, err := a.store.Posts.GetByID(r.Context(), postID)
	if err != nil || post == nil {
		writeError(w, http.StatusNotFound, "post not found")
		return
	}

	if userFromContext(r.Context()) == nil && post.Status != "published" {
		writeError(w, http.StatusNotFound, "post not found")
		return
	}

	writeJSON(w, http.StatusOK, post)
}

func (a *API) handleGetPostBySlug(w http.ResponseWriter, r *http.Request) {
	slug := strings.TrimSpace(chi.URLParam(r, "slug"))
	if slug == "" {
		writeError(w, http.StatusBadRequest, "missing slug")
		return
	}

	post, err := a.store.Posts.GetBySlug(r.Context(), slug)
	if err != nil || post == nil {
		writeError(w, http.StatusNotFound, "post not found")
		return
	}

	if userFromContext(r.Context()) == nil && post.Status != "published" {
		writeError(w, http.StatusNotFound, "post not found")
		return
	}

	writeJSON(w, http.StatusOK, post)
}

func (a *API) handleUpdatePost(w http.ResponseWriter, r *http.Request) {
	postID, err := parseID(chi.URLParam(r, "postID"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid post id")
		return
	}

	var payload postRequest
	if err := readJSON(r, &payload); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if strings.TrimSpace(payload.Title) == "" || strings.TrimSpace(payload.Slug) == "" || strings.TrimSpace(payload.Markdown) == "" {
		writeError(w, http.StatusBadRequest, "title, slug, and markdown are required")
		return
	}

	status := normalizeStatus(payload.Status)
	post := store.Post{
		Title:       strings.TrimSpace(payload.Title),
		Slug:        strings.TrimSpace(payload.Slug),
		Summary:     strings.TrimSpace(payload.Summary),
		Markdown:    payload.Markdown,
		Status:      status,
		PublishedAt: payload.PublishedAt,
	}

	updated, err := a.store.Posts.Update(r.Context(), postID, post)
	if err != nil || updated == nil {
		writeError(w, http.StatusNotFound, "post not found")
		return
	}

	writeJSON(w, http.StatusOK, updated)
}

func (a *API) handleDeletePost(w http.ResponseWriter, r *http.Request) {
	postID, err := parseID(chi.URLParam(r, "postID"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid post id")
		return
	}

	if err := a.store.Posts.Delete(r.Context(), postID); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to delete post")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}

func (a *API) handleLinkPostAlbum(w http.ResponseWriter, r *http.Request) {
	postID, err := parseID(chi.URLParam(r, "postID"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid post id")
		return
	}

	var payload struct {
		AlbumID int64 `json:"album_id"`
	}
	if err := readJSON(r, &payload); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if payload.AlbumID == 0 {
		writeError(w, http.StatusBadRequest, "album_id is required")
		return
	}

	if err := a.store.Links.LinkPostToAlbum(r.Context(), postID, payload.AlbumID); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to link album")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "linked"})
}

func (a *API) handleListPostAlbums(w http.ResponseWriter, r *http.Request) {
	postID, err := parseID(chi.URLParam(r, "postID"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid post id")
		return
	}

	albums, err := a.store.Links.ListAlbumsForPost(r.Context(), postID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list albums")
		return
	}

	writeJSON(w, http.StatusOK, albums)
}

func normalizeStatus(status string) string {
	switch strings.ToLower(strings.TrimSpace(status)) {
	case "published":
		return "published"
	case "archived":
		return "archived"
	default:
		return "draft"
	}
}
