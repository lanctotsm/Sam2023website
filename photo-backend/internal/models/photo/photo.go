// Package photo contains models and types related to photo management domain.
// This includes photo metadata, upload requests, and photo-related responses.
package photo

import "time"

// PhotoMetadata represents the complete metadata for a photo stored in the system.
// This is the core entity in the photo domain, containing all information
// needed to manage, display, and organize photos within albums.
type PhotoMetadata struct {
	// Core identification
	ID      string `json:"id" dynamodbav:"id"`             // Unique photo identifier (UUID)
	AlbumID string `json:"album_id" dynamodbav:"album_id"` // Album this photo belongs to

	// Storage references - S3 keys for different image variants
	OriginalKey  string `json:"originalKey" dynamodbav:"originalKey"`   // Full resolution image
	ThumbnailKey string `json:"thumbnailKey" dynamodbav:"thumbnailKey"` // Small preview image
	MediumKey    string `json:"mediumKey" dynamodbav:"mediumKey"`       // Medium resolution image

	// User-provided metadata
	Title       string   `json:"title" dynamodbav:"title"`             // User-defined photo title
	Description string   `json:"description" dynamodbav:"description"` // User-defined description
	Tags        []string `json:"tags" dynamodbav:"tags"`               // User-defined tags for organization

	// System metadata
	UploadedAt  time.Time `json:"uploadedAt" dynamodbav:"uploadedAt"`   // When photo was uploaded
	FileSize    int64     `json:"fileSize" dynamodbav:"fileSize"`       // Original file size in bytes
	Width       int       `json:"width" dynamodbav:"width"`             // Image width in pixels
	Height      int       `json:"height" dynamodbav:"height"`           // Image height in pixels
	ContentType string    `json:"contentType" dynamodbav:"contentType"` // MIME type (image/jpeg, image/png)
}

// UploadRequest represents the payload for photo upload requests.
// Contains the image data and metadata provided by the client during upload.
// This is a data transfer object (DTO) used for API communication.
type UploadRequest struct {
	AlbumID     string   `json:"albumId" validate:"required"`     // Album ID where photo will be stored
	ImageData   string   `json:"imageData" validate:"required"`   // Base64-encoded image data
	ContentType string   `json:"contentType" validate:"required"` // MIME type of the image
	Title       string   `json:"title"`                           // Optional user-provided title
	Description string   `json:"description"`                     // Optional user-provided description
	Tags        []string `json:"tags"`                            // Optional user-provided tags
}

// ListPhotosResponse represents the response structure for photo listing endpoints.
// Provides both the photo data and metadata about the result set for pagination
// and client-side display logic.
type ListPhotosResponse struct {
	Photos []PhotoMetadata `json:"photos"` // Array of photo metadata objects
	Count  int             `json:"count"`  // Total number of photos in the response
}

// PhotoDimensions represents the dimensions of an image.
// Used during image processing and for responsive display calculations.
type PhotoDimensions struct {
	Width  int `json:"width"`  // Image width in pixels
	Height int `json:"height"` // Image height in pixels
}

// PhotoVariant represents different sizes/qualities of the same photo.
// Used during image processing to generate multiple variants for different use cases.
type PhotoVariant struct {
	Key         string          `json:"key"`         // S3 storage key
	Dimensions  PhotoDimensions `json:"dimensions"`  // Image dimensions
	FileSize    int64           `json:"file_size"`   // File size in bytes
	ContentType string          `json:"content_type"` // MIME type
}

// ProcessedPhoto represents a photo after processing with all its variants.
// This is used internally during the upload and processing pipeline.
type ProcessedPhoto struct {
	ID          string                  `json:"id"`       // Unique photo identifier
	Original    PhotoVariant            `json:"original"` // Original uploaded image
	Variants    map[string]PhotoVariant `json:"variants"` // Different sizes (thumbnail, medium, etc.)
	Metadata    PhotoMetadata           `json:"metadata"` // Complete photo metadata
	ProcessedAt time.Time               `json:"processed_at"` // When processing completed
}