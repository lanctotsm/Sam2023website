package service

import (
	"context"
	"net/http"
	"strings"

	"github.com/aws/aws-lambda-go/events"
)

// RouteHandler defines the contract for all route handlers.
// This interface enables polymorphic behavior and makes the system extensible.
// All handlers must implement this interface to be compatible with the router.
type RouteHandler interface {
	// Handle processes an HTTP request and returns an API Gateway response.
	// Implementations should handle their specific business logic and error cases.
	Handle(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error)
}

// Router handles HTTP request routing using a two-level map structure.
// It implements a simple but effective routing mechanism that supports
// exact path matching and basic pattern matching for RESTful APIs.
// The router follows the Command pattern where each route maps to a handler.
type Router struct {
	routes          map[string]map[string]RouteHandler // [HTTP_METHOD][PATH] -> Handler
	responseBuilder *ResponseBuilder                   // For generating error responses
}

// NewRouter creates a new Router instance with an empty route table.
// The router uses a nested map structure for O(1) route lookup performance.
//
// Returns:
//   - *Router: A new router instance ready to accept route registrations
func NewRouter() *Router {
	return &Router{
		routes:          make(map[string]map[string]RouteHandler),
		responseBuilder: NewResponseBuilder(),
	}
}

// AddRoute registers a new route handler for the specified HTTP method and path.
// This method supports the fluent interface pattern and handles the internal
// map initialization automatically. Routes are registered at application startup.
//
// Parameters:
//   - method: HTTP method (GET, POST, PUT, DELETE, etc.)
//   - path: URL path pattern (supports exact match and simple patterns)
//   - handler: The handler implementation for this route
func (r *Router) AddRoute(method, path string, handler RouteHandler) {
	if r.routes[method] == nil {
		r.routes[method] = make(map[string]RouteHandler)
	}
	r.routes[method][path] = handler
}

// Route dispatches an incoming request to the appropriate handler.
// Implements a two-phase matching strategy:
// 1. Exact path matching for performance
// 2. Pattern matching for parameterized routes
// Returns appropriate HTTP error responses for unmatched routes.
//
// Parameters:
//   - ctx: Request context for cancellation and timeouts
//   - request: The incoming API Gateway request
//
// Returns:
//   - events.APIGatewayProxyResponse: The handler response or routing error
//   - error: Any system-level errors during routing
func (r *Router) Route(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	methodRoutes, exists := r.routes[request.HTTPMethod]
	if !exists {
		return r.responseBuilder.Error(http.StatusMethodNotAllowed, "method not allowed"), nil
	}
	
	// Try exact match first for optimal performance
	if handler, exists := methodRoutes[request.Path]; exists {
		return handler.Handle(ctx, request)
	}
	
	// Try pattern matching for parameterized routes (e.g., /photos/{id})
	for pattern, handler := range methodRoutes {
		if r.matchesPattern(request.Path, pattern) {
			return handler.Handle(ctx, request)
		}
	}
	
	return r.responseBuilder.Error(http.StatusNotFound, "endpoint not found"), nil
}

// matchesPattern determines if a request path matches a route pattern.
// Supports two pattern types:
// 1. Parameterized paths: "/photos/{id}" matches "/photos/123"
// 2. Prefix paths: "/photos/" matches "/photos/anything"
// This private method encapsulates the pattern matching logic.
//
// Parameters:
//   - path: The actual request path
//   - pattern: The route pattern to match against
//
// Returns:
//   - bool: true if the path matches the pattern
func (r *Router) matchesPattern(path, pattern string) bool {
	// Handle parameterized patterns like "/photos/{id}"
	if strings.Contains(pattern, "{") {
		patternParts := strings.Split(pattern, "/")
		pathParts := strings.Split(path, "/")
		
		if len(patternParts) != len(pathParts) {
			return false
		}
		
		for i, part := range patternParts {
			// Skip parameter placeholders (anything in {})
			if !strings.HasPrefix(part, "{") && part != pathParts[i] {
				return false
			}
		}
		return true
	}
	
	// Handle prefix patterns like "/photos/"
	if strings.HasSuffix(pattern, "/") {
		return strings.HasPrefix(path, pattern) && len(path) > len(pattern)
	}
	
	return false
}