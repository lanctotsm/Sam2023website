// Package handler provides HTTP request handlers for the photo management API.
// It implements the presentation layer of the application, handling HTTP requests,
// routing, authentication, and response formatting. The package follows clean
// architecture principles with clear separation of concerns.
package handler

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"github.com/aws/aws-lambda-go/events"

	"photo-backend/internal/middleware"
	"photo-backend/internal/models/album"
	"photo-backend/internal/models/auth"
	"photo-backend/internal/models/photo"
	"photo-backend/internal/service"
)



// Handler orchestrates HTTP request processing for the photo management API.
// It uses composition to combine specialized services and follows dependency injection
// patterns for testability. The handler delegates business logic to service layers
// and focuses solely on HTTP concerns like routing, authentication, and response formatting.
type Handler struct {
	// Core business services
	photoService *service.PhotoService
	authService  *service.AuthService
	albumService *service.AlbumService
	
	// Infrastructure components
	authMiddleware *middleware.AuthMiddleware
	
	// Utility services
	responseBuilder    *service.ResponseBuilder
	sessionExtractor   *service.SessionExtractor
	validationService  *service.ValidationService
	router            *service.Router
}

// NewHandler creates a new Handler with all required dependencies injected.
// This constructor validates dependencies and initializes utility services.
// All routes are configured during initialization for immediate use.
//
// Parameters:
//   - photoService: Handles photo-related business operations
//   - authService: Manages authentication and session operations  
//   - albumService: Handles album-related business operations
//   - authMiddleware: Provides authentication protection for endpoints
//
// Returns:
//   - *Handler: Fully configured handler ready to process HTTP requests
//   - error: Validation error if required dependencies are missing
func NewHandler(photoService *service.PhotoService, authService *service.AuthService, albumService *service.AlbumService, authMiddleware *middleware.AuthMiddleware) (*Handler, error) {
	// Validate required dependencies
	if photoService == nil {
		return nil, fmt.Errorf("photoService is required")
	}
	if authService == nil {
		return nil, fmt.Errorf("authService is required")
	}
	if albumService == nil {
		return nil, fmt.Errorf("albumService is required")
	}
	if authMiddleware == nil {
		return nil, fmt.Errorf("authMiddleware is required")
	}

	h := &Handler{
		photoService:       photoService,
		authService:        authService,
		albumService:       albumService,
		authMiddleware:     authMiddleware,
		responseBuilder:    service.NewResponseBuilder(),
		sessionExtractor:   service.NewSessionExtractor(),
		validationService:  service.NewValidationService(),
		router:            service.NewRouter(),
	}
	
	h.setupRoutes()
	return h, nil
}

// setupRoutes configures all API endpoints and their corresponding handlers.
// Routes are organized by functional domain for clarity and maintainability.
func (h *Handler) setupRoutes() {
	// Authentication endpoints
	h.router.AddRoute("POST", "/auth/login", &AuthLoginHandler{h})
	h.router.AddRoute("GET", "/auth/callback", &AuthCallbackHandler{h})
	h.router.AddRoute("POST", "/auth/logout", &AuthLogoutHandler{h})
	h.router.AddRoute("GET", "/auth/status", &AuthStatusHandler{h})
	
	// Album management endpoints
	h.router.AddRoute("POST", "/albums", &ProtectedCreateAlbumHandler{h})
	h.router.AddRoute("GET", "/albums", &ProtectedListAlbumsHandler{h})
	h.router.AddRoute("PUT", "/albums/{albumId}/thumbnail", &ProtectedSetAlbumThumbnailHandler{h})
	h.router.AddRoute("DELETE", "/albums/{albumId}", &ProtectedDeleteAlbumHandler{h})
	
	// Photo management endpoints
	h.router.AddRoute("POST", "/upload", &ProtectedUploadHandler{h})
	h.router.AddRoute("GET", "/photos", &ProtectedListPhotosHandler{h})
	h.router.AddRoute("GET", "/photos/{id}", &ProtectedGetPhotoHandler{h})
	h.router.AddRoute("DELETE", "/photos/{id}", &ProtectedDeletePhotoHandler{h})
	h.router.AddRoute("GET", "/albums/{albumId}/photos", &ProtectedListAlbumPhotosHandler{h})
}

// HandleRequest is the main entry point for AWS Lambda invocations.
// It serves as the adapter between AWS Lambda and the application's HTTP routing.
// CORS preflight requests are handled directly, while other requests are routed.
//
// Parameters:
//   - ctx: Request context with timeout and cancellation support
//   - request: API Gateway proxy request containing HTTP details
//
// Returns:
//   - events.APIGatewayProxyResponse: HTTP response for API Gateway
//   - error: System-level errors during request processing
func (h *Handler) HandleRequest(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	if request.HTTPMethod == "OPTIONS" {
		return h.responseBuilder.CORS(), nil
	}
	
	return h.router.Route(ctx, request)
}

// Route Handler Implementations
// Each handler implements the RouteHandler interface and handles a specific endpoint.
// Handlers use composition to access the main Handler's services and utilities.

// AuthLoginHandler initiates OAuth authentication flow.
type AuthLoginHandler struct {
	*Handler
}

// Handle processes login initiation requests by generating OAuth URL and state.
func (h *AuthLoginHandler) Handle(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	state, err := h.authService.GenerateOAuthState()
	if err != nil {
		return h.responseBuilder.Error(http.StatusInternalServerError, "failed to generate OAuth state"), nil
	}
	
	oauthURL := h.authService.GetGoogleOAuthURL(state)
	
	response := map[string]string{
		"oauth_url": oauthURL,
		"state":     state,
	}
	
	return h.responseBuilder.Success(response), nil
}

// AuthCallbackHandler completes OAuth authentication flow.
type AuthCallbackHandler struct {
	*Handler
}

// Handle processes OAuth callback from Google with CSRF protection and session creation.
func (h *AuthCallbackHandler) Handle(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	state := request.QueryStringParameters["state"]
	if state == "" {
		return h.responseBuilder.Error(http.StatusBadRequest, "OAuth state parameter is required"), nil
	}
	
	validState, err := h.authService.ValidateOAuthState(state)
	if err != nil {
		return h.responseBuilder.Error(http.StatusInternalServerError, fmt.Errorf("validating OAuth state: %w", err).Error()), nil
	}
	if !validState {
		return h.responseBuilder.Error(http.StatusBadRequest, "invalid or expired OAuth state"), nil
	}
	
	code := request.QueryStringParameters["code"]
	if code == "" {
		return h.responseBuilder.Error(http.StatusBadRequest, "authorization code is required"), nil
	}
	
	accessToken, err := h.authService.ExchangeCodeForToken(code)
	if err != nil {
		return h.responseBuilder.Error(http.StatusBadRequest, fmt.Errorf("exchanging code for token: %w", err).Error()), nil
	}
	
	user, err := h.authService.ValidateGoogleToken(accessToken)
	if err != nil {
		errorMsg := h.mapAuthErrorMessage(err)
		return h.responseBuilder.Error(http.StatusUnauthorized, errorMsg), nil
	}
	
	session, err := h.authService.CreateSession(user.Email)
	if err != nil {
		return h.responseBuilder.Error(http.StatusInternalServerError, fmt.Errorf("creating session: %w", err).Error()), nil
	}
	
	cookieHeader := fmt.Sprintf("session=%s; HttpOnly; Secure; SameSite=Strict; Max-Age=86400", session.SessionToken)
	additionalHeaders := service.HTTPHeaders{"Set-Cookie": cookieHeader}
	
	return h.responseBuilder.Redirect("/", additionalHeaders), nil
}

// AuthLogoutHandler terminates user sessions securely.
type AuthLogoutHandler struct {
	*Handler
}

// Handle processes logout requests with idempotent session cleanup.
func (h *AuthLogoutHandler) Handle(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	sessionToken := h.sessionExtractor.ExtractToken(request)
	if sessionToken != "" {
		h.authService.ExpireSession(sessionToken)
	}
	
	additionalHeaders := service.HTTPHeaders{"Set-Cookie": "session=; HttpOnly; Secure; SameSite=Strict; Max-Age=0"}
	response := map[string]string{"message": "logged out successfully"}
	
	return h.responseBuilder.SuccessWithHeaders(response, additionalHeaders), nil
}

// AuthStatusHandler checks current authentication state.
type AuthStatusHandler struct {
	*Handler
}

// Handle returns authentication status without triggering auth flows.
func (h *AuthStatusHandler) Handle(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	sessionToken := h.sessionExtractor.ExtractToken(request)
	if sessionToken == "" {
		return h.responseBuilder.Success(auth.AuthStatus{Authenticated: false}), nil
	}
	
	result, err := h.authService.ValidateSession(sessionToken)
	if err != nil || !result.Valid {
		return h.responseBuilder.Success(auth.AuthStatus{Authenticated: false}), nil
	}
	
	return h.responseBuilder.Success(auth.AuthStatus{
		Authenticated: true,
		User:          result.User,
	}), nil
}

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





// mapAuthErrorMessage converts authentication errors to user-friendly messages.
func (h *Handler) mapAuthErrorMessage(err error) string {
	errMsg := err.Error()
	switch {
	case contains(errMsg, "2FA", "two-factor"):
		return "Two-factor authentication is required"
	case contains(errMsg, "invalid token"):
		return "Invalid authentication token"
	case contains(errMsg, "expired"):
		return "Authentication token has expired"
	default:
		return "Authentication failed"
	}
}

// contains checks if any of the substrings exist in the main string.
func contains(s string, substrings ...string) bool {
	for _, substr := range substrings {
		if strings.Contains(s, substr) {
			return true
		}
	}
	return false
}






// Album Handler Implementations
// Each handler implements the RouteHandler interface and handles album-specific endpoints.

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

// ProtectedListAlbumsHandler handles GET /albums requests for authenticated album listing.
type ProtectedListAlbumsHandler struct {
	*Handler
}

// Handle processes authenticated album listing requests.
func (h *ProtectedListAlbumsHandler) Handle(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	return h.authMiddleware.RequireAuth(h.handleListAlbumsAuthenticated)(ctx, request)
}

// handleListAlbumsAuthenticated processes album listing for authenticated users.
func (h *Handler) handleListAlbumsAuthenticated(ctx context.Context, request events.APIGatewayProxyRequest, user *auth.User) (events.APIGatewayProxyResponse, error) {
	albums, err := h.albumService.ListAlbumsWithThumbnails(user.Email)
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

// ProtectedListAlbumPhotosHandler handles authenticated GET /albums/{albumId}/photos requests.
type ProtectedListAlbumPhotosHandler struct {
	*Handler
}

// Handle processes authenticated album-specific photo listing requests.
func (h *ProtectedListAlbumPhotosHandler) Handle(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	return h.authMiddleware.RequireAuth(h.handleListAlbumPhotosAuthenticated)(ctx, request)
}

// handleListAlbumPhotosAuthenticated processes album photo listing for authenticated users.
func (h *Handler) handleListAlbumPhotosAuthenticated(ctx context.Context, request events.APIGatewayProxyRequest, user *auth.User) (events.APIGatewayProxyResponse, error) {
	albumID := h.validationService.ExtractIDFromPath(request.Path, "/albums/")
	if albumID == "" {
		return h.responseBuilder.Error(http.StatusBadRequest, "album ID is required"), nil
	}

	albumID = h.validationService.CleanPathSuffix(albumID, "/photos")

	response, err := h.photoService.ListPhotosByAlbum(albumID)
	if err != nil {
		statusCode := h.validationService.MapServiceErrorToHTTPStatus(err)
		return h.responseBuilder.Error(statusCode, fmt.Errorf("listing album photos: %w", err).Error()), nil
	}

	return h.responseBuilder.Success(response), nil
}