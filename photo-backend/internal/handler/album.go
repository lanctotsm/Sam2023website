package handler

import (
	"context"
	"fmt"
	"net/http"

	"github.com/aws/aws-lambda-go/events"

	"photo-backend/internal/models/album"
	"photo-backend/internal/models/auth"
)

// ProtectedCreateAlbumHandler handles POST /albums requests for authenticated album creation.
type ProtectedCreateAlbumHandler struct {
	*Handler
}

// Handle processes authenticated album creation requests.
func (h *ProtectedCreateAlbumHandler) Handle(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	return h.authMiddleware.RequireAuth(h.handleCreateAlbumAuthenticated)(ctx, request)
}

// handleCreateAlbumAuthenticated processes album creation for authenticated users.
func (h *Handler) handleCreateAlbumAuthenticated(ctx context.Context, request events.APIGatewayProxyRequest, user *auth.User) (events.APIGatewayProxyResponse, error) {
	var createReq album.CreateAlbumRequest
	if err := h.validationService.ValidateJSONRequest(request.Body, &createReq); err != nil {
		return h.responseBuilder.Error(http.StatusBadRequest, err.Error()), nil
	}

	if err := h.validationService.ValidateRequiredString(createReq.Name, "name"); err != nil {
		return h.responseBuilder.Error(http.StatusBadRequest, err.Error()), nil
	}

	albumData, err := h.albumService.CreateAlbum(createReq.Name, user.Email)
	if err != nil {
		statusCode := h.validationService.MapServiceErrorToHTTPStatus(err)
		return h.responseBuilder.Error(statusCode, fmt.Errorf("creating album: %w", err).Error()), nil
	}

	return h.responseBuilder.Success(albumData), nil
}

// ListAlbumsHandler handles GET /albums requests for public album listing.
type ListAlbumsHandler struct {
	*Handler
}

// Handle processes album listing requests and falls back to authorized user when unauthenticated.
func (h *ListAlbumsHandler) Handle(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	viewerEmail := h.resolveViewerEmail(request)
	albums, err := h.albumService.ListAlbumsWithThumbnails(viewerEmail)
	if err != nil {
		return h.responseBuilder.Error(http.StatusInternalServerError, fmt.Errorf("listing albums: %w", err).Error()), nil
	}

	response := h.buildAlbumsResponse(albums)
	return h.responseBuilder.Success(response), nil
}

// buildAlbumsResponse converts album data to response format.
func (h *Handler) buildAlbumsResponse(albums []album.AlbumWithThumbnail) album.ListAlbumsResponse {
	response := album.ListAlbumsResponse{
		Albums: make([]album.AlbumSummary, len(albums)),
		Count:  len(albums),
	}

	for i, albumWithThumbnail := range albums {
		response.Albums[i] = album.AlbumSummary{
			AlbumID:     albumWithThumbnail.Album.AlbumID,
			Name:        albumWithThumbnail.Album.Name,
			PhotoCount:  albumWithThumbnail.Album.PhotoCount,
			ThumbnailID: albumWithThumbnail.Album.ThumbnailID,
			CreatedAt:   albumWithThumbnail.Album.CreatedAt,
			UpdatedAt:   albumWithThumbnail.Album.UpdatedAt,
		}
	}

	return response
}

// ProtectedSetAlbumThumbnailHandler handles PUT /albums/{albumId}/thumbnail requests.
type ProtectedSetAlbumThumbnailHandler struct {
	*Handler
}

// Handle processes authenticated album thumbnail setting requests.
func (h *ProtectedSetAlbumThumbnailHandler) Handle(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	return h.authMiddleware.RequireAuth(h.handleSetAlbumThumbnailAuthenticated)(ctx, request)
}

// handleSetAlbumThumbnailAuthenticated processes album thumbnail setting for authenticated users.
func (h *Handler) handleSetAlbumThumbnailAuthenticated(ctx context.Context, request events.APIGatewayProxyRequest, user *auth.User) (events.APIGatewayProxyResponse, error) {
	albumID := h.validationService.ExtractIDFromPath(request.Path, "/albums/")
	if albumID == "" {
		return h.responseBuilder.Error(http.StatusBadRequest, "album ID is required"), nil
	}

	albumID = h.validationService.CleanPathSuffix(albumID, "/thumbnail")

	var updateReq album.UpdateAlbumRequest
	if err := h.validationService.ValidateJSONRequest(request.Body, &updateReq); err != nil {
		return h.responseBuilder.Error(http.StatusBadRequest, err.Error()), nil
	}

	if updateReq.ThumbnailID == nil {
		return h.responseBuilder.Error(http.StatusBadRequest, "thumbnail_id is required"), nil
	}

	if err := h.albumService.SetAlbumThumbnail(albumID, *updateReq.ThumbnailID, user.Email); err != nil {
		statusCode := h.validationService.MapServiceErrorToHTTPStatus(err)
		return h.responseBuilder.Error(statusCode, fmt.Errorf("setting album thumbnail: %w", err).Error()), nil
	}

	updatedAlbum, err := h.albumService.GetAlbum(albumID, user.Email)
	if err != nil {
		return h.responseBuilder.Error(http.StatusInternalServerError, fmt.Errorf("getting updated album: %w", err).Error()), nil
	}

	return h.responseBuilder.Success(updatedAlbum), nil
}

// ProtectedDeleteAlbumHandler handles DELETE /albums/{albumId} requests.
type ProtectedDeleteAlbumHandler struct {
	*Handler
}

// Handle processes authenticated album deletion requests.
func (h *ProtectedDeleteAlbumHandler) Handle(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	return h.authMiddleware.RequireAuth(h.handleDeleteAlbumAuthenticated)(ctx, request)
}

// handleDeleteAlbumAuthenticated processes album deletion for authenticated users.
func (h *Handler) handleDeleteAlbumAuthenticated(ctx context.Context, request events.APIGatewayProxyRequest, user *auth.User) (events.APIGatewayProxyResponse, error) {
	albumID := h.validationService.ExtractIDFromPath(request.Path, "/albums/")
	if albumID == "" {
		return h.responseBuilder.Error(http.StatusBadRequest, "album ID is required"), nil
	}

	if err := h.albumService.DeleteAlbum(albumID, user.Email); err != nil {
		statusCode := h.validationService.MapServiceErrorToHTTPStatus(err)
		return h.responseBuilder.Error(statusCode, fmt.Errorf("deleting album: %w", err).Error()), nil
	}

	return h.responseBuilder.Success(map[string]string{"message": "album deleted successfully"}), nil
}

// ListAlbumPhotosHandler handles GET /albums/{albumId}/photos requests for public viewing.
type ListAlbumPhotosHandler struct {
	*Handler
}

// Handle processes album photo listing for any viewer while ensuring ownership checks.
func (h *ListAlbumPhotosHandler) Handle(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	albumID := h.validationService.ExtractIDFromPath(request.Path, "/albums/")
	if albumID == "" {
		return h.responseBuilder.Error(http.StatusBadRequest, "album ID is required"), nil
	}

	albumID = h.validationService.CleanPathSuffix(albumID, "/photos")
	viewerEmail := h.resolveViewerEmail(request)

	if _, err := h.albumService.GetAlbum(albumID, viewerEmail); err != nil {
		statusCode := h.validationService.MapServiceErrorToHTTPStatus(err)
		return h.responseBuilder.Error(statusCode, fmt.Errorf("getting album: %w", err).Error()), nil
	}

	response, err := h.photoService.ListPhotosByAlbum(albumID)
	if err != nil {
		statusCode := h.validationService.MapServiceErrorToHTTPStatus(err)
		return h.responseBuilder.Error(statusCode, fmt.Errorf("listing album photos: %w", err).Error()), nil
	}

	return h.responseBuilder.Success(response), nil
}

// resolveViewerEmail determines which user email should be used for read-only operations.
// Unauthenticated viewers are mapped to the configured authorized email.
func (h *Handler) resolveViewerEmail(request events.APIGatewayProxyRequest) string {
	sessionToken := h.sessionExtractor.ExtractToken(request)
	if sessionToken == "" {
		return h.authService.AuthorizedEmail()
	}

	result, err := h.authService.ValidateSession(sessionToken)
	if err != nil || result == nil || !result.Valid || result.User == nil || result.User.Email == "" {
		return h.authService.AuthorizedEmail()
	}

	return result.User.Email
}