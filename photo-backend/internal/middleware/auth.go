package middleware

import (
	"context"
	"fmt"

	"github.com/aws/aws-lambda-go/events"

	"photo-backend/internal/models/auth"
)

// AuthServiceInterface defines the interface for authentication service operations
type AuthServiceInterface interface {
	ValidateSession(sessionToken string) (*auth.SessionValidationResult, error)
}

// AuthMiddleware provides authentication middleware functionality
type AuthMiddleware struct {
	authService     AuthServiceInterface
	tokenExtractor  *TokenExtractor
	responseBuilder *ResponseBuilder
}

// NewAuthMiddleware creates a new AuthMiddleware instance
func NewAuthMiddleware(authService AuthServiceInterface) *AuthMiddleware {
	return &AuthMiddleware{
		authService:     authService,
		tokenExtractor:  NewTokenExtractor(),
		responseBuilder: NewResponseBuilder(),
	}
}

// RequireAuth wraps a handler to require authentication
func (m *AuthMiddleware) RequireAuth(handler func(context.Context, events.APIGatewayProxyRequest, *auth.User) (events.APIGatewayProxyResponse, error)) func(context.Context, events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	return func(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
		// Extract session token
		sessionToken := m.tokenExtractor.ExtractSessionToken(request)
		if sessionToken == "" {
			return m.responseBuilder.UnauthorizedResponse("Authentication required. Please log in."), nil
		}

		// Validate session
		result, err := m.authService.ValidateSession(sessionToken)
		if err != nil {
			return m.responseBuilder.InternalErrorResponse("Authentication service error"), nil
		}

		if !result.Valid {
			// Provide specific error messages
			errorMsg := m.getSessionErrorMessage(result.Error)
			return m.responseBuilder.UnauthorizedResponse(errorMsg), nil
		}

		// Add user to context for potential use by other middleware
		ctxWithUser := context.WithValue(ctx, "user", result.User)
		ctxWithUser = context.WithValue(ctxWithUser, "session", result.Session)

		// Call the wrapped handler with user context
		return handler(ctxWithUser, request, result.User)
	}
}

// OptionalAuth wraps a handler to optionally extract user information
func (m *AuthMiddleware) OptionalAuth(handler func(context.Context, events.APIGatewayProxyRequest, *auth.User) (events.APIGatewayProxyResponse, error)) func(context.Context, events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	return func(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
		var user *auth.User

		// Try to extract and validate session token
		sessionToken := m.tokenExtractor.ExtractSessionToken(request)
		if sessionToken != "" {
			result, err := m.authService.ValidateSession(sessionToken)
			if err == nil && result.Valid {
				user = result.User
			}
		}

		// Call the wrapped handler (user may be nil)
		return handler(ctx, request, user)
	}
}

// getSessionErrorMessage converts session validation errors to user-friendly messages
func (m *AuthMiddleware) getSessionErrorMessage(errorMsg string) string {
	switch errorMsg {
	case "session expired":
		return "Session expired. Please log in again."
	case "invalid session token":
		return "Invalid session. Please log in again."
	default:
		if errorMsg != "" {
			return errorMsg
		}
		return "Invalid session"
	}
}

// GetUserFromContext extracts user from context (helper function)
func GetUserFromContext(ctx context.Context) *auth.User {
	if user, ok := ctx.Value("user").(*auth.User); ok {
		return user
	}
	return nil
}

// GetSessionFromContext extracts session from context (helper function)
func GetSessionFromContext(ctx context.Context) *auth.Session {
	if session, ok := ctx.Value("session").(*auth.Session); ok {
		return session
	}
	return nil
}

// GetUserFromSessionToken extracts user information from a session token
func (m *AuthMiddleware) GetUserFromSessionToken(sessionToken string) (*auth.User, error) {
	if sessionToken == "" {
		return nil, fmt.Errorf("session token is required")
	}

	// Validate session
	result, err := m.authService.ValidateSession(sessionToken)
	if err != nil {
		return nil, fmt.Errorf("failed to validate session: %w", err)
	}

	if !result.Valid {
		return nil, fmt.Errorf("invalid session: %s", result.Error)
	}

	return result.User, nil
}

// RequireAuthorizedUser wraps a handler to require the specific authorized user
func (m *AuthMiddleware) RequireAuthorizedUser(authorizedEmail string, handler func(context.Context, events.APIGatewayProxyRequest, *auth.User) (events.APIGatewayProxyResponse, error)) func(context.Context, events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	return m.RequireAuth(func(ctx context.Context, request events.APIGatewayProxyRequest, user *auth.User) (events.APIGatewayProxyResponse, error) {
		// Check if user is the authorized user
		if user.Email != authorizedEmail {
			return m.responseBuilder.ForbiddenResponse(fmt.Sprintf("Access denied. Only %s is authorized.", authorizedEmail)), nil
		}

		// Call the wrapped handler
		return handler(ctx, request, user)
	})
}