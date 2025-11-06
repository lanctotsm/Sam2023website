// Package handler provides HTTP request handlers for the photo management API.
// It implements the presentation layer of the application, handling HTTP requests,
// routing, authentication, and response formatting. The package follows clean
// architecture principles with clear separation of concerns.
//
// Handler organization:
//   - handler.go: Core Handler struct, routing, and main entry point
//   - auth.go: Authentication-related handlers (login, logout, callback, status)
//   - photo.go: Photo management handlers (upload, list, get, delete)
//   - album.go: Album management handlers (create, list, update, delete)
package handler

import (
	"context"
	"fmt"

	"github.com/aws/aws-lambda-go/events"

	"photo-backend/internal/middleware"
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