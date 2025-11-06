package middleware

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"github.com/aws/aws-lambda-go/events"

	"photo-backend/internal/models/auth"
)

// AuthServiceInterface defines the interface for authentication service operations
type AuthServiceInterface interface {
	ValidateSession(sessionToken string) (*auth.SessionValidationResult, error)
}

// AuthMiddleware provides authentication middleware functionality
type AuthMiddleware struct {
	authService AuthServiceInterface
}

// NewAuthMiddleware creates a new AuthMiddleware instance
func NewAuthMiddleware(authService AuthServiceInterface) *AuthMiddleware {
	return &AuthMiddleware{
		authService: authService,
	}
}

// RequireAuth wraps a handler to require authentication
func (m *AuthMiddleware) RequireAuth(handler func(context.Context, events.APIGatewayProxyRequest, *auth.User) (events.APIGatewayProxyResponse, error)) func(context.Context, events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	return func(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
		// Extract session token from Authorization header or cookie
		sessionToken := m.extractSessionToken(request)
		if sessionToken == "" {
			return m.unauthorizedResponse("Authentication required. Please log in."), nil
		}

		// Validate session
		result, err := m.authService.ValidateSession(sessionToken)
		if err != nil {
			return m.errorResponse(http.StatusInternalServerError, "Authentication service error"), nil
		}

		if !result.Valid {
			// Provide specific error messages based on validation result
			errorMsg := "Invalid session"
			if result.Error != "" {
				switch result.Error {
				case "session expired":
					errorMsg = "Session expired. Please log in again."
				case "invalid session token":
					errorMsg = "Invalid session. Please log in again."
				default:
					errorMsg = result.Error
				}
			}
			return m.unauthorizedResponse(errorMsg), nil
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
		sessionToken := m.extractSessionToken(request)
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

// extractSessionToken extracts session token from request
func (m *AuthMiddleware) extractSessionToken(request events.APIGatewayProxyRequest) string {
	// Try Authorization header first (Bearer token)
	if auth := request.Headers["Authorization"]; auth != "" {
		if strings.HasPrefix(auth, "Bearer ") {
			return strings.TrimPrefix(auth, "Bearer ")
		}
	}

	// Try lowercase authorization header
	if auth := request.Headers["authorization"]; auth != "" {
		if strings.HasPrefix(auth, "Bearer ") {
			return strings.TrimPrefix(auth, "Bearer ")
		}
	}

	// Try session cookie
	if cookie := request.Headers["Cookie"]; cookie != "" {
		return m.extractSessionFromCookie(cookie)
	}

	// Try lowercase cookie header
	if cookie := request.Headers["cookie"]; cookie != "" {
		return m.extractSessionFromCookie(cookie)
	}

	return ""
}

// extractSessionFromCookie extracts session token from cookie string
func (m *AuthMiddleware) extractSessionFromCookie(cookieHeader string) string {
	cookies := strings.Split(cookieHeader, ";")
	for _, cookie := range cookies {
		cookie = strings.TrimSpace(cookie)
		if strings.HasPrefix(cookie, "session=") {
			return strings.TrimPrefix(cookie, "session=")
		}
	}
	return ""
}

// unauthorizedResponse returns a 401 Unauthorized response
func (m *AuthMiddleware) unauthorizedResponse(message string) events.APIGatewayProxyResponse {
	return events.APIGatewayProxyResponse{
		StatusCode: http.StatusUnauthorized,
		Headers: map[string]string{
			"Content-Type":                 "application/json",
			"Access-Control-Allow-Origin":  "*",
			"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization, Cookie",
			"Access-Control-Allow-Credentials": "true",
		},
		Body: fmt.Sprintf(`{"error": "%s", "code": "UNAUTHORIZED"}`, message),
	}
}

// forbiddenResponse returns a 403 Forbidden response
func (m *AuthMiddleware) forbiddenResponse(message string) events.APIGatewayProxyResponse {
	return events.APIGatewayProxyResponse{
		StatusCode: http.StatusForbidden,
		Headers: map[string]string{
			"Content-Type":                 "application/json",
			"Access-Control-Allow-Origin":  "*",
			"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization, Cookie",
			"Access-Control-Allow-Credentials": "true",
		},
		Body: fmt.Sprintf(`{"error": "%s", "code": "FORBIDDEN"}`, message),
	}
}

// errorResponse returns an error response
func (m *AuthMiddleware) errorResponse(statusCode int, message string) events.APIGatewayProxyResponse {
	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Headers: map[string]string{
			"Content-Type":                 "application/json",
			"Access-Control-Allow-Origin":  "*",
			"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization, Cookie",
			"Access-Control-Allow-Credentials": "true",
		},
		Body: fmt.Sprintf(`{"error": "%s", "code": "ERROR"}`, message),
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
			return m.forbiddenResponse(fmt.Sprintf("Access denied. Only %s is authorized.", authorizedEmail)), nil
		}

		// Call the wrapped handler
		return handler(ctx, request, user)
	})
}