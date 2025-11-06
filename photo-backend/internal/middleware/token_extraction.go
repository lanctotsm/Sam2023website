package middleware

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/aws/aws-lambda-go/events"
)

// TokenExtractor handles session token extraction from requests
type TokenExtractor struct{}

// NewTokenExtractor creates a new TokenExtractor
func NewTokenExtractor() *TokenExtractor {
	return &TokenExtractor{}
}

// ExtractSessionToken extracts session token from request with simplified logic
func (t *TokenExtractor) ExtractSessionToken(request events.APIGatewayProxyRequest) string {
	// Try Authorization header (case-insensitive)
	for key, value := range request.Headers {
		if strings.ToLower(key) == "authorization" && value != "" {
			if strings.HasPrefix(value, "Bearer ") {
				return strings.TrimPrefix(value, "Bearer ")
			}
		}
	}

	// Try Cookie header (case-insensitive)
	for key, value := range request.Headers {
		if strings.ToLower(key) == "cookie" && value != "" {
			return t.extractSessionFromCookie(value)
		}
	}

	return ""
}

// extractSessionFromCookie extracts session token from cookie string
func (t *TokenExtractor) extractSessionFromCookie(cookieHeader string) string {
	cookies := strings.Split(cookieHeader, ";")
	for _, cookie := range cookies {
		cookie = strings.TrimSpace(cookie)
		if strings.HasPrefix(cookie, "session=") {
			return strings.TrimPrefix(cookie, "session=")
		}
	}
	return ""
}

// ResponseBuilder creates standardized API responses
type ResponseBuilder struct {
	corsHeaders map[string]string
}

// NewResponseBuilder creates a new ResponseBuilder with standard CORS headers
func NewResponseBuilder() *ResponseBuilder {
	return &ResponseBuilder{
		corsHeaders: map[string]string{
			"Content-Type":                     "application/json",
			"Access-Control-Allow-Origin":      "*",
			"Access-Control-Allow-Methods":     "GET, POST, PUT, DELETE, OPTIONS",
			"Access-Control-Allow-Headers":     "Content-Type, Authorization, Cookie",
			"Access-Control-Allow-Credentials": "true",
		},
	}
}

// ErrorResponse creates a standardized error response
func (r *ResponseBuilder) ErrorResponse(statusCode int, message, code string) events.APIGatewayProxyResponse {
	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Headers:    r.corsHeaders,
		Body:       fmt.Sprintf(`{"error": "%s", "code": "%s"}`, message, code),
	}
}

// UnauthorizedResponse creates a 401 response
func (r *ResponseBuilder) UnauthorizedResponse(message string) events.APIGatewayProxyResponse {
	return r.ErrorResponse(http.StatusUnauthorized, message, "UNAUTHORIZED")
}

// ForbiddenResponse creates a 403 response
func (r *ResponseBuilder) ForbiddenResponse(message string) events.APIGatewayProxyResponse {
	return r.ErrorResponse(http.StatusForbidden, message, "FORBIDDEN")
}

// InternalErrorResponse creates a 500 response
func (r *ResponseBuilder) InternalErrorResponse(message string) events.APIGatewayProxyResponse {
	return r.ErrorResponse(http.StatusInternalServerError, message, "INTERNAL_ERROR")
}