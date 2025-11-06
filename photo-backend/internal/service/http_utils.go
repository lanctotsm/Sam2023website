package service

import (
	"encoding/json"
	"net/http"

	"github.com/aws/aws-lambda-go/events"
)

// HTTPHeaders defines a type alias for HTTP headers map to improve readability
// and provide type safety for header operations throughout the service package.
type HTTPHeaders map[string]string

// ResponseBuilder handles common HTTP response building logic following the Builder pattern.
// It encapsulates response creation with consistent headers, error handling, and JSON marshaling.
// This promotes DRY principles and ensures consistent response formatting across all endpoints.
type ResponseBuilder struct {
	defaultHeaders HTTPHeaders // Standard headers applied to all responses
}

// NewResponseBuilder creates a new ResponseBuilder instance with predefined default headers.
// The default headers include CORS settings, content type, and security configurations
// that are applied to all HTTP responses unless overridden.
//
// Returns:
//   - *ResponseBuilder: A new instance with default CORS and security headers configured
func NewResponseBuilder() *ResponseBuilder {
	return &ResponseBuilder{
		defaultHeaders: HTTPHeaders{
			"Content-Type":                     "application/json",
			"Access-Control-Allow-Origin":      "*",
			"Access-Control-Allow-Methods":     "GET, POST, PUT, DELETE, OPTIONS",
			"Access-Control-Allow-Headers":     "Content-Type, Authorization, Cookie",
			"Access-Control-Allow-Credentials": "true",
		},
	}
}

// Success creates a successful HTTP response (200 OK) with the provided data.
// This is a convenience method that calls SuccessWithHeaders with no additional headers.
//
// Parameters:
//   - data: The response payload to be JSON-marshaled and returned
//
// Returns:
//   - events.APIGatewayProxyResponse: A complete API Gateway response with status 200
func (rb *ResponseBuilder) Success(data interface{}) events.APIGatewayProxyResponse {
	return rb.SuccessWithHeaders(data, nil)
}

// SuccessWithHeaders creates a successful HTTP response with custom headers.
// Allows for response-specific headers while maintaining default headers.
// Additional headers will override default headers if they have the same key.
//
// Parameters:
//   - data: The response payload to be JSON-marshaled
//   - additionalHeaders: Optional headers to merge with defaults
//
// Returns:
//   - events.APIGatewayProxyResponse: A complete API Gateway response with status 200
func (rb *ResponseBuilder) SuccessWithHeaders(data interface{}, additionalHeaders HTTPHeaders) events.APIGatewayProxyResponse {
	body, _ := json.Marshal(data)
	headers := rb.mergeHeaders(additionalHeaders)
	
	return events.APIGatewayProxyResponse{
		StatusCode: http.StatusOK,
		Headers:    headers,
		Body:       string(body),
	}
}

// Error creates an HTTP error response with the specified status code and message.
// This is a convenience method that calls ErrorWithHeaders with no additional headers.
//
// Parameters:
//   - statusCode: HTTP status code (e.g., 400, 401, 404, 500)
//   - message: Human-readable error message
//
// Returns:
//   - events.APIGatewayProxyResponse: A complete API Gateway error response
func (rb *ResponseBuilder) Error(statusCode int, message string) events.APIGatewayProxyResponse {
	return rb.ErrorWithHeaders(statusCode, message, nil)
}

// ErrorWithHeaders creates an HTTP error response with custom headers.
// Formats the error message as JSON with a consistent structure: {"error": "message"}.
// Useful for adding specific headers like authentication challenges or cache control.
//
// Parameters:
//   - statusCode: HTTP status code for the error
//   - message: Human-readable error message
//   - additionalHeaders: Optional headers to merge with defaults
//
// Returns:
//   - events.APIGatewayProxyResponse: A complete API Gateway error response
func (rb *ResponseBuilder) ErrorWithHeaders(statusCode int, message string, additionalHeaders HTTPHeaders) events.APIGatewayProxyResponse {
	body, _ := json.Marshal(map[string]string{"error": message})
	headers := rb.mergeHeaders(additionalHeaders)
	
	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Headers:    headers,
		Body:       string(body),
	}
}

// Redirect creates an HTTP redirect response (302 Found) to the specified location.
// Commonly used after successful authentication or form submissions.
//
// Parameters:
//   - location: The URL to redirect to
//   - additionalHeaders: Optional headers (e.g., Set-Cookie for session management)
//
// Returns:
//   - events.APIGatewayProxyResponse: A complete API Gateway redirect response
func (rb *ResponseBuilder) Redirect(location string, additionalHeaders HTTPHeaders) events.APIGatewayProxyResponse {
	headers := rb.mergeHeaders(additionalHeaders)
	headers["Location"] = location
	
	return events.APIGatewayProxyResponse{
		StatusCode: http.StatusFound,
		Headers:    headers,
		Body:       "",
	}
}

// CORS creates a CORS preflight response for OPTIONS requests.
// Returns a 200 OK response with appropriate CORS headers to allow
// cross-origin requests from web browsers.
//
// Returns:
//   - events.APIGatewayProxyResponse: A complete CORS preflight response
func (rb *ResponseBuilder) CORS() events.APIGatewayProxyResponse {
	return events.APIGatewayProxyResponse{
		StatusCode: http.StatusOK,
		Headers:    rb.defaultHeaders,
		Body:       "",
	}
}

// mergeHeaders combines default headers with additional headers.
// Additional headers take precedence over default headers when keys conflict.
// This private method ensures consistent header merging behavior across all response types.
//
// Parameters:
//   - additionalHeaders: Headers to merge with defaults (can be nil)
//
// Returns:
//   - map[string]string: Combined headers ready for API Gateway response
func (rb *ResponseBuilder) mergeHeaders(additionalHeaders HTTPHeaders) map[string]string {
	headers := make(map[string]string)
	
	// Copy default headers
	for k, v := range rb.defaultHeaders {
		headers[k] = v
	}
	
	// Override with additional headers
	if additionalHeaders != nil {
		for k, v := range additionalHeaders {
			headers[k] = v
		}
	}
	
	return headers
}