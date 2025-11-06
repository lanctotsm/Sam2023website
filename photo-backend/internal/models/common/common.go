// Package common contains shared models and types used across multiple domains.
// This includes common response structures, error types, and utility models.
package common

import "time"

// APIResponse represents a standard API response structure.
// Provides consistent response formatting across all endpoints.
type APIResponse struct {
	Success   bool        `json:"success"`             // Whether the operation was successful
	Data      interface{} `json:"data,omitempty"`      // Response payload (if successful)
	Error     *APIError   `json:"error,omitempty"`     // Error information (if failed)
	Timestamp time.Time   `json:"timestamp"`           // Response timestamp
	RequestID string      `json:"request_id,omitempty"` // Optional request correlation ID
}

// APIError represents structured error information in API responses.
// Provides consistent error formatting with codes and details for client handling.
type APIError struct {
	Code    string `json:"code"`              // Machine-readable error code
	Message string `json:"message"`           // Human-readable error message
	Details string `json:"details,omitempty"` // Additional error details
}

// PaginationRequest represents pagination parameters for list operations.
// Provides consistent pagination across all list endpoints.
type PaginationRequest struct {
	Page     int `json:"page" validate:"min=1"`      // Page number (1-based)
	PageSize int `json:"page_size" validate:"min=1,max=100"` // Items per page (1-100)
	SortBy   string `json:"sort_by,omitempty"`       // Field to sort by
	SortDesc bool   `json:"sort_desc,omitempty"`     // Sort in descending order
}

// PaginationResponse represents pagination metadata in list responses.
// Provides information needed for client-side pagination controls.
type PaginationResponse struct {
	Page       int  `json:"page"`        // Current page number
	PageSize   int  `json:"page_size"`   // Items per page
	TotalItems int  `json:"total_items"` // Total number of items available
	TotalPages int  `json:"total_pages"` // Total number of pages
	HasNext    bool `json:"has_next"`    // Whether there are more pages
	HasPrev    bool `json:"has_prev"`    // Whether there are previous pages
}

// HealthCheckResponse represents the response structure for health check endpoints.
// Used for monitoring and load balancer health checks.
type HealthCheckResponse struct {
	Status    string            `json:"status"`              // Overall health status (healthy, unhealthy)
	Timestamp time.Time         `json:"timestamp"`           // Health check timestamp
	Version   string            `json:"version,omitempty"`   // Application version
	Services  map[string]string `json:"services,omitempty"`  // Status of dependent services
	Uptime    int64             `json:"uptime,omitempty"`    // Application uptime in seconds
}

// ValidationError represents field-level validation errors.
// Used for detailed validation error reporting in API responses.
type ValidationError struct {
	Field   string `json:"field"`   // Name of the field that failed validation
	Message string `json:"message"` // Validation error message
	Value   string `json:"value"`   // The invalid value that was provided
}

// ValidationErrorResponse represents a collection of validation errors.
// Used when multiple fields fail validation in a single request.
type ValidationErrorResponse struct {
	Message string            `json:"message"` // Overall validation error message
	Errors  []ValidationError `json:"errors"`  // Individual field validation errors
}

// Metadata represents common metadata fields used across entities.
// Provides consistent audit trail information for all domain objects.
type Metadata struct {
	CreatedAt time.Time `json:"created_at" dynamodbav:"created_at"` // Entity creation timestamp
	UpdatedAt time.Time `json:"updated_at" dynamodbav:"updated_at"` // Last modification timestamp
	CreatedBy string    `json:"created_by" dynamodbav:"created_by"` // User who created the entity
	UpdatedBy string    `json:"updated_by" dynamodbav:"updated_by"` // User who last modified the entity
	Version   int       `json:"version" dynamodbav:"version"`       // Entity version for optimistic locking
}

// SortOrder represents sort direction for list operations.
type SortOrder string

const (
	// SortAsc represents ascending sort order
	SortAsc SortOrder = "asc"
	// SortDesc represents descending sort order
	SortDesc SortOrder = "desc"
)

// FilterOperator represents comparison operators for filtering operations.
type FilterOperator string

const (
	// FilterEquals represents equality comparison
	FilterEquals FilterOperator = "eq"
	// FilterNotEquals represents inequality comparison
	FilterNotEquals FilterOperator = "ne"
	// FilterGreaterThan represents greater than comparison
	FilterGreaterThan FilterOperator = "gt"
	// FilterGreaterThanOrEqual represents greater than or equal comparison
	FilterGreaterThanOrEqual FilterOperator = "gte"
	// FilterLessThan represents less than comparison
	FilterLessThan FilterOperator = "lt"
	// FilterLessThanOrEqual represents less than or equal comparison
	FilterLessThanOrEqual FilterOperator = "lte"
	// FilterContains represents substring/contains comparison
	FilterContains FilterOperator = "contains"
	// FilterStartsWith represents prefix comparison
	FilterStartsWith FilterOperator = "starts_with"
)

// Filter represents a single filter condition for list operations.
type Filter struct {
	Field    string         `json:"field"`    // Field name to filter on
	Operator FilterOperator `json:"operator"` // Comparison operator
	Value    interface{}    `json:"value"`    // Value to compare against
}

// ListRequest represents a generic list request with pagination, sorting, and filtering.
// Can be embedded in domain-specific list request types.
type ListRequest struct {
	Pagination PaginationRequest `json:"pagination,omitempty"` // Pagination parameters
	Filters    []Filter          `json:"filters,omitempty"`    // Filter conditions
	SortBy     string            `json:"sort_by,omitempty"`    // Field to sort by
	SortOrder  SortOrder         `json:"sort_order,omitempty"` // Sort direction
}

// ListResponse represents a generic list response with data and pagination.
// Can be embedded in domain-specific list response types.
type ListResponse struct {
	Data       interface{}        `json:"data"`       // List of items
	Pagination PaginationResponse `json:"pagination"` // Pagination metadata
}