package service

import (
	"encoding/json"
	"fmt"
	"strings"
)

// ValidationService handles common request validation logic.
// It provides reusable validation functions for common patterns like
// ID extraction, JSON parsing, and input validation.
// This promotes code reusability and consistency across handlers.
type ValidationService struct{}

// NewValidationService creates a new ValidationService instance.
// This factory function follows Go conventions for constructor-like functions
// and allows for future extension with configuration options.
//
// Returns:
//   - *ValidationService: A new instance ready to perform validations
func NewValidationService() *ValidationService {
	return &ValidationService{}
}

// ExtractIDFromPath extracts an ID from a URL path given a prefix.
// This is commonly used for RESTful endpoints like /photos/{id} or /albums/{id}.
// The function removes the prefix and returns the remaining path segment as the ID.
//
// Parameters:
//   - path: The full URL path (e.g., "/photos/123")
//   - prefix: The prefix to remove (e.g., "/photos/")
//
// Returns:
//   - string: The extracted ID, or empty string if path is too short
//
// Example:
//   - ExtractIDFromPath("/photos/123", "/photos/") returns "123"
//   - ExtractIDFromPath("/albums/abc-def/photos", "/albums/") returns "abc-def/photos"
func (vs *ValidationService) ExtractIDFromPath(path, prefix string) string {
	if len(path) <= len(prefix) {
		return ""
	}
	return path[len(prefix):]
}

// ValidateJSONRequest validates and parses a JSON request body into the target struct.
// This function provides consistent JSON parsing with proper error handling
// and validation across all endpoints that accept JSON payloads.
//
// Parameters:
//   - requestBody: The raw JSON string from the HTTP request body
//   - target: A pointer to the struct where the parsed JSON should be stored
//
// Returns:
//   - error: Validation error if the body is empty or JSON is malformed
//
// Example:
//   var req photo.UploadRequest
//   err := vs.ValidateJSONRequest(request.Body, &req)
func (vs *ValidationService) ValidateJSONRequest(requestBody string, target interface{}) error {
	if requestBody == "" {
		return fmt.Errorf("request body is required")
	}
	
	if err := json.Unmarshal([]byte(requestBody), target); err != nil {
		return fmt.Errorf("invalid JSON format: %v", err)
	}
	
	return nil
}

// MapServiceErrorToHTTPStatus maps service layer errors to appropriate HTTP status codes.
// This function provides consistent error code mapping across all handlers,
// ensuring that similar errors always return the same HTTP status codes.
//
// Parameters:
//   - err: The error from the service layer
//
// Returns:
//   - int: The appropriate HTTP status code (400, 401, 403, 404, 409, 500)
//
// Error Mapping:
//   - "not found" -> 404 Not Found
//   - "access denied" -> 403 Forbidden
//   - "unauthorized" -> 401 Unauthorized
//   - "invalid", "required", "cannot be empty", "cannot exceed", "contains invalid" -> 400 Bad Request
//   - "already exists" -> 409 Conflict
//   - All other errors -> 500 Internal Server Error
func (vs *ValidationService) MapServiceErrorToHTTPStatus(err error) int {
	if err == nil {
		return 200 // OK
	}
	
	errMsg := err.Error()
	
	// Check for specific error patterns
	switch {
	case strings.Contains(errMsg, "not found"):
		return 404 // Not Found
	case strings.Contains(errMsg, "access denied"):
		return 403 // Forbidden
	case strings.Contains(errMsg, "unauthorized"):
		return 401 // Unauthorized
	case strings.Contains(errMsg, "invalid"):
		return 400 // Bad Request
	case strings.Contains(errMsg, "required"):
		return 400 // Bad Request
	case strings.Contains(errMsg, "cannot be empty"):
		return 400 // Bad Request
	case strings.Contains(errMsg, "cannot exceed"):
		return 400 // Bad Request
	case strings.Contains(errMsg, "contains invalid"):
		return 400 // Bad Request
	case strings.Contains(errMsg, "does not belong"):
		return 400 // Bad Request
	case strings.Contains(errMsg, "already exists"):
		return 409 // Conflict
	default:
		return 500 // Internal Server Error
	}
}

// IsProtectedPageRequest checks if the request is for a protected page.
// Protected pages should return 404 for unauthenticated users instead of
// revealing their existence. This helps maintain security by not exposing
// the application structure to unauthorized users.
//
// Parameters:
//   - path: The request path to check
//
// Returns:
//   - bool: true if the path is for a protected page
//
// Protected Pages:
//   - /upload - Photo upload interface
//   - /admin - Administrative interface
//   - /dashboard - User dashboard
func (vs *ValidationService) IsProtectedPageRequest(path string) bool {
	protectedPages := []string{"/upload", "/admin", "/dashboard"}
	for _, page := range protectedPages {
		if strings.HasPrefix(path, page) {
			return true
		}
	}
	return false
}

// ValidateRequiredString checks if a string field is present and non-empty.
// This is a common validation pattern for required string fields in request payloads.
//
// Parameters:
//   - value: The string value to validate
//   - fieldName: The name of the field (used in error messages)
//
// Returns:
//   - error: Validation error if the field is empty or missing
func (vs *ValidationService) ValidateRequiredString(value, fieldName string) error {
	if value == "" {
		return fmt.Errorf("%s is required", fieldName)
	}
	return nil
}

// CleanPathSuffix removes a specific suffix from a path if present.
// This is useful for extracting clean IDs from paths that may have additional
// suffixes like "/thumbnail" or "/photos".
//
// Parameters:
//   - path: The original path
//   - suffix: The suffix to remove
//
// Returns:
//   - string: The path with the suffix removed, or the original path if suffix not found
//
// Example:
//   - CleanPathSuffix("album123/thumbnail", "/thumbnail") returns "album123"
//   - CleanPathSuffix("album123/photos", "/photos") returns "album123"
func (vs *ValidationService) CleanPathSuffix(path, suffix string) string {
	if strings.HasSuffix(path, suffix) {
		return path[:len(path)-len(suffix)]
	}
	return path
}