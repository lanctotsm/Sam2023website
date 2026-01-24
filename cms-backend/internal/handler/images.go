package handler

import (
	"net/http"
	"path"
	"strings"

	"cms-backend/internal/store"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type imageRequest struct {
	S3Key   string `json:"s3_key"`
	Width   *int   `json:"width"`
	Height  *int   `json:"height"`
	Caption string `json:"caption"`
	AltText string `json:"alt_text"`
}

type presignRequest struct {
	FileName    string `json:"file_name"`
	ContentType string `json:"content_type"`
	Size        int64  `json:"size"`
}

type presignResponse struct {
	UploadURL string `json:"upload_url"`
	S3Key     string `json:"s3_key"`
	PublicURL string `json:"public_url"`
}

func (a *API) handlePresignImage(w http.ResponseWriter, r *http.Request) {
	var payload presignRequest
	if err := readJSON(r, &payload); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if strings.TrimSpace(payload.FileName) == "" || strings.TrimSpace(payload.ContentType) == "" {
		writeError(w, http.StatusBadRequest, "file_name and content_type are required")
		return
	}

	ext := path.Ext(payload.FileName)
	key := "uploads/" + uuid.New().String() + ext

	url, err := a.s3.PresignPut(r.Context(), key, payload.ContentType, payload.Size)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to presign upload")
		return
	}

	publicURL := strings.TrimRight(a.cfg.S3PublicBaseURL, "/") + "/" + key
	writeJSON(w, http.StatusOK, presignResponse{
		UploadURL: url,
		S3Key:     key,
		PublicURL: publicURL,
	})
}

func (a *API) handleCreateImage(w http.ResponseWriter, r *http.Request) {
	var payload imageRequest
	if err := readJSON(r, &payload); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if strings.TrimSpace(payload.S3Key) == "" {
		writeError(w, http.StatusBadRequest, "s3_key is required")
		return
	}

	image := store.Image{
		S3Key:   strings.TrimSpace(payload.S3Key),
		Width:   payload.Width,
		Height:  payload.Height,
		Caption: strings.TrimSpace(payload.Caption),
		AltText: strings.TrimSpace(payload.AltText),
	}

	created, err := a.store.Images.Create(r.Context(), image)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create image")
		return
	}

	writeJSON(w, http.StatusCreated, created)
}

func (a *API) handleListImages(w http.ResponseWriter, r *http.Request) {
	images, err := a.store.Images.List(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list images")
		return
	}

	writeJSON(w, http.StatusOK, images)
}

func (a *API) handleGetImage(w http.ResponseWriter, r *http.Request) {
	imageID, err := parseID(chi.URLParam(r, "imageID"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid image id")
		return
	}

	image, err := a.store.Images.GetByID(r.Context(), imageID)
	if err != nil || image == nil {
		writeError(w, http.StatusNotFound, "image not found")
		return
	}

	writeJSON(w, http.StatusOK, image)
}

func (a *API) handleUpdateImage(w http.ResponseWriter, r *http.Request) {
	imageID, err := parseID(chi.URLParam(r, "imageID"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid image id")
		return
	}

	var payload imageRequest
	if err := readJSON(r, &payload); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if strings.TrimSpace(payload.S3Key) == "" {
		writeError(w, http.StatusBadRequest, "s3_key is required")
		return
	}

	image := store.Image{
		S3Key:   strings.TrimSpace(payload.S3Key),
		Width:   payload.Width,
		Height:  payload.Height,
		Caption: strings.TrimSpace(payload.Caption),
		AltText: strings.TrimSpace(payload.AltText),
	}

	updated, err := a.store.Images.Update(r.Context(), imageID, image)
	if err != nil || updated == nil {
		writeError(w, http.StatusNotFound, "image not found")
		return
	}

	writeJSON(w, http.StatusOK, updated)
}

func (a *API) handleDeleteImage(w http.ResponseWriter, r *http.Request) {
	imageID, err := parseID(chi.URLParam(r, "imageID"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid image id")
		return
	}

	if err := a.store.Images.Delete(r.Context(), imageID); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to delete image")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}
