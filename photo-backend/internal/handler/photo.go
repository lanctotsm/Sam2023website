package handler

import (
	"context"
	"fmt"
	"net/http"

	"github.com/aws/aws-lambda-go/events"

	"photo-backend/internal/models/auth"
	"photo-backend/internal/models/photo"
)

// ProtectedUploadHandler handles POST /upload requests for authenticated photo uploads.
// This handler enforces authentication before allowing photo uploads, ensuring
// only authorized users can add photos to the system. It delegates to middleware
// for authentication and then processes the actual upload.
type ProtectedUploadHandler struct {
	*Handler // Embedded Handler provides access to photo services and middleware
}

// Handle processes authenticated photo upload requests.
// Uses authentication middleware to verify user credentials before proceeding
// with the upload. This ensures the upload endpoint is protected and only
// accessible to authenticated users.
//
// Parameters:
//   - ctx: Request context for cancellation and timeouts
//   - request: API Gateway request containing photo data and metadata
//
// Returns:
//   - events.APIGatewayProxyResponse: Upload result or authentication error
//   - error: Any system errors during authentication or upload processing
func (h *ProtectedUploadHandler) Handle(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	// Apply authentication middleware before processing upload
	return h.authMiddleware.RequireAuth(h.handleUploadAuthenticated)(ctx, request)
}

// handleUploadAuthenticated processes photo uploads for authenticated users.
func (h *Handler) handleUploadAuthenticated(ctx context.Context, request events.APIGatewayProxyRequest, user *auth.User) (events.APIGatewayProxyResponse, error) {
	var uploadReq photo.UploadRequest
	if err := h.validationService.ValidateJSONRequest(request.Body, &uploadReq); err != nil {
		return h.responseBuilder.Error(http.StatusBadRequest, err.Error()), nil
	}

	if err := h.validateUploadRequest(&uploadReq); err != nil {
		return h.responseBuilder.Error(http.StatusBadRequest, err.Error()), nil
	}

	metadata, err := h.photoService.UploadPhoto(&uploadReq)
	if err != nil {
		statusCode := h.validationService.MapServiceErrorToHTTPStatus(err)
		return h.responseBuilder.Error(statusCode, fmt.Errorf("uploading photo: %w", err).Error()), nil
	}

	return h.responseBuilder.Success(metadata), nil
}

// validateUploadRequest validates required fields in upload request.
func (h *Handler) validateUploadRequest(req *photo.UploadRequest) error {
	if err := h.validationService.ValidateRequiredString(req.ImageData, "imageData"); err != nil {
		return err
	}
	if err := h.validationService.ValidateRequiredString(req.ContentType, "contentType"); err != nil {
		return err
	}
	if err := h.validationService.ValidateRequiredString(req.AlbumID, "albumId"); err != nil {
		return err
	}
	return nil
}

// ProtectedListPhotosHandler handles authenticated photo listing requests
type ProtectedListPhotosHandler struct {
	*Handler
}

func (h *ProtectedListPhotosHandler) Handle(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	return h.authMiddleware.RequireAuth(h.handleListPhotosAuthenticated)(ctx, request)
}

func (h *Handler) handleListPhotosAuthenticated(ctx context.Context, request events.APIGatewayProxyRequest, user *auth.User) (events.APIGatewayProxyResponse, error) {
	response, err := h.photoService.ListPhotos()
	if err != nil {
		return h.responseBuilder.Error(http.StatusInternalServerError, fmt.Errorf("listing photos: %w", err).Error()), nil
	}

	return h.responseBuilder.Success(response), nil
}

// ProtectedGetPhotoHandler handles authenticated individual photo requests
type ProtectedGetPhotoHandler struct {
	*Handler
}

func (h *ProtectedGetPhotoHandler) Handle(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	return h.authMiddleware.RequireAuth(h.handleGetPhotoAuthenticated)(ctx, request)
}

func (h *Handler) handleGetPhotoAuthenticated(ctx context.Context, request events.APIGatewayProxyRequest, user *auth.User) (events.APIGatewayProxyResponse, error) {
	photoID := h.validationService.ExtractIDFromPath(request.Path, "/photos/")
	if photoID == "" {
		return h.responseBuilder.Error(http.StatusBadRequest, "photo ID is required"), nil
	}

	photo, err := h.photoService.GetPhoto(photoID)
	if err != nil {
		statusCode := h.validationService.MapServiceErrorToHTTPStatus(err)
		return h.responseBuilder.Error(statusCode, fmt.Errorf("getting photo: %w", err).Error()), nil
	}

	return h.responseBuilder.Success(photo), nil
}

// ProtectedDeletePhotoHandler handles authenticated photo deletion
type ProtectedDeletePhotoHandler struct {
	*Handler
}

func (h *ProtectedDeletePhotoHandler) Handle(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	// Use middleware for authentication
	return h.authMiddleware.RequireAuth(h.handleDeletePhotoAuthenticated)(ctx, request)
}

func (h *Handler) handleDeletePhotoAuthenticated(ctx context.Context, request events.APIGatewayProxyRequest, user *auth.User) (events.APIGatewayProxyResponse, error) {
	photoID := h.validationService.ExtractIDFromPath(request.Path, "/photos/")
	if photoID == "" {
		return h.responseBuilder.Error(http.StatusBadRequest, "photo ID is required"), nil
	}

	if err := h.photoService.DeletePhoto(photoID); err != nil {
		statusCode := h.validationService.MapServiceErrorToHTTPStatus(err)
		return h.responseBuilder.Error(statusCode, fmt.Errorf("deleting photo: %w", err).Error()), nil
	}

	return h.responseBuilder.Success(map[string]string{"message": "photo deleted successfully"}), nil
}