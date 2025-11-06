// Package album contains models and types related to album management domain.
// This includes album entities, creation requests, and album-related responses.
package album

import "time"

// Album represents a photo album entity stored in the system.
// Albums are containers that organize photos into logical groups,
// providing structure and organization for photo collections.
type Album struct {
	// Core identification
	AlbumID   string `json:"album_id" dynamodbav:"album_id"`     // Unique album identifier (UUID)
	UserEmail string `json:"user_email" dynamodbav:"user_email"` // Owner of the album

	// Album properties
	Name        string `json:"name" dynamodbav:"name"`                                   // User-defined album name
	ThumbnailID string `json:"thumbnail_id,omitempty" dynamodbav:"thumbnail_id,omitempty"` // Photo ID to use as album cover

	// Statistics and metadata
	PhotoCount int       `json:"photo_count" dynamodbav:"photo_count"` // Number of photos in album
	CreatedAt  time.Time `json:"created_at" dynamodbav:"created_at"`   // When album was created
	UpdatedAt  time.Time `json:"updated_at" dynamodbav:"updated_at"`   // Last modification time
}

// CreateAlbumRequest represents the payload for album creation requests.
// Contains the minimal information needed to create a new album.
type CreateAlbumRequest struct {
	Name string `json:"name" validate:"required,min=1,max=100"` // Album name (1-100 characters)
}

// UpdateAlbumRequest represents the payload for album update requests.
// Allows modification of album properties after creation.
type UpdateAlbumRequest struct {
	Name        *string `json:"name,omitempty"`         // Optional new album name
	ThumbnailID *string `json:"thumbnail_id,omitempty"` // Optional new thumbnail photo ID
}

// AlbumSummary represents a lightweight album view for listing operations.
// Contains essential album information without heavy metadata for efficient listing.
type AlbumSummary struct {
	AlbumID     string    `json:"album_id"`     // Unique album identifier
	Name        string    `json:"name"`         // Album name
	PhotoCount  int       `json:"photo_count"`  // Number of photos in album
	ThumbnailID string    `json:"thumbnail_id"` // Cover photo ID (if set)
	CreatedAt   time.Time `json:"created_at"`   // Creation timestamp
	UpdatedAt   time.Time `json:"updated_at"`   // Last update timestamp
}

// AlbumWithThumbnail represents an album with its thumbnail image information.
// Used for display purposes where album cover images are needed.
type AlbumWithThumbnail struct {
	Album        Album  `json:"album"`                    // Complete album information
	ThumbnailURL string `json:"thumbnail_url,omitempty"` // URL to thumbnail image (if available)
}

// ListAlbumsResponse represents the response structure for album listing endpoints.
// Provides album data with pagination and summary information.
type ListAlbumsResponse struct {
	Albums []AlbumSummary `json:"albums"` // Array of album summaries
	Count  int            `json:"count"`  // Total number of albums in response
}

// AlbumStats represents statistical information about an album.
// Used for analytics and display purposes in album management interfaces.
type AlbumStats struct {
	AlbumID        string    `json:"album_id"`        // Album identifier
	PhotoCount     int       `json:"photo_count"`     // Total photos in album
	TotalFileSize  int64     `json:"total_file_size"` // Combined size of all photos in bytes
	LastPhotoAdded time.Time `json:"last_photo_added"` // Timestamp of most recent photo addition
	CreatedAt      time.Time `json:"created_at"`      // Album creation timestamp
}

// AlbumPermissions represents access control information for an album.
// Currently supports single-user ownership but designed for future multi-user features.
type AlbumPermissions struct {
	AlbumID   string `json:"album_id"`   // Album identifier
	OwnerEmail string `json:"owner_email"` // Email of album owner
	IsPublic  bool   `json:"is_public"`  // Whether album is publicly viewable (future feature)
	CreatedAt time.Time `json:"created_at"` // When permissions were set
}