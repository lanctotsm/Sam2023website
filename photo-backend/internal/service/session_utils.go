package service

import (
	"strings"

	"github.com/aws/aws-lambda-go/events"
)

// SessionExtractor handles session token extraction from HTTP requests.
// It implements the Strategy pattern to support multiple token sources
// (Authorization header, cookies) with a consistent interface.
// This separation of concerns makes authentication token handling testable and reusable.
type SessionExtractor struct{}

// NewSessionExtractor creates a new SessionExtractor instance.
// This factory function follows Go conventions for constructor-like functions
// and allows for future extension with configuration options.
//
// Returns:
//   - *SessionExtractor: A new instance ready to extract session tokens
func NewSessionExtractor() *SessionExtractor {
	return &SessionExtractor{}
}

// ExtractToken extracts session token from an API Gateway request.
// Implements a fallback strategy checking multiple sources in order of preference:
// 1. Authorization header (Bearer token) - standard for API clients
// 2. Session cookie - standard for web browsers
// 3. Case-insensitive header variants for robustness
//
// Parameters:
//   - request: The API Gateway proxy request containing headers
//
// Returns:
//   - string: The extracted session token, or empty string if none found
func (se *SessionExtractor) ExtractToken(request events.APIGatewayProxyRequest) string {
	// Try Authorization header first (Bearer token)
	if token := se.extractFromAuthHeader(request.Headers["Authorization"]); token != "" {
		return token
	}
	
	// Try lowercase authorization header (some clients send lowercase)
	if token := se.extractFromAuthHeader(request.Headers["authorization"]); token != "" {
		return token
	}
	
	// Try session cookie
	if token := se.extractFromCookie(request.Headers["Cookie"]); token != "" {
		return token
	}
	
	// Try lowercase cookie header
	if token := se.extractFromCookie(request.Headers["cookie"]); token != "" {
		return token
	}
	
	return ""
}

// extractFromAuthHeader extracts Bearer token from Authorization header.
// Validates the header format and extracts the token portion.
// This private method encapsulates the Bearer token parsing logic.
//
// Parameters:
//   - authHeader: The Authorization header value
//
// Returns:
//   - string: The extracted token, or empty string if invalid format
func (se *SessionExtractor) extractFromAuthHeader(authHeader string) string {
	if authHeader != "" && len(authHeader) > 7 && authHeader[:7] == "Bearer " {
		return authHeader[7:]
	}
	return ""
}

// extractFromCookie extracts session token from cookie header string.
// Parses the cookie header format and looks for the 'session' cookie.
// Handles multiple cookies and proper cookie parsing according to HTTP standards.
//
// Parameters:
//   - cookieHeader: The Cookie header value containing one or more cookies
//
// Returns:
//   - string: The session cookie value, or empty string if not found
func (se *SessionExtractor) extractFromCookie(cookieHeader string) string {
	if cookieHeader == "" {
		return ""
	}
	
	cookies := make(map[string]string)
	for _, cookie := range strings.Split(cookieHeader, ";") {
		parts := strings.SplitN(strings.TrimSpace(cookie), "=", 2)
		if len(parts) == 2 {
			cookies[parts[0]] = parts[1]
		}
	}
	return cookies["session"]
}