// Package service provides business logic services for the photo management application.
// The photo service handles photo upload, processing, storage, and retrieval operations
// while coordinating with storage layers and image processing components.
package service

import (
	"encoding/base64"
	"fmt"
	"time"

	"github.com/google/uuid"

	"photo-backend/internal/models/album"
	"photo-backend/internal/models/photo"
	"photo-backend/internal/processor"
)

// S3StorageInterface defines operations for S3 file storage.
type S3StorageInterface interface {
	UploadFile(key string, data []byte, contentType string) error
	DeleteFile(key string) error
	GetFileURL(key string) string
}

// PhotoStorageFullInterface defines complete operations for photo metadata persistence.
type PhotoStorageFullInterface interface {
	SavePhoto(photoMeta *photo.PhotoMetadata) error
	GetPhoto(id string) (*photo.PhotoMetadata, error)
	ListPhotos() ([]photo.PhotoMetadata, error)
	ListPhotosByAlbum(albumID string) ([]photo.PhotoMetadata, error)
	DeletePhoto(id string) error
}

// AlbumServiceInterface defines album-related operations needed by photo service.
type AlbumServiceInterface interface {
	GetAlbum(albumID string, userEmail string) (*album.Album, error)
	UpdateAlbumPhotoCount(albumID string, delta int) error
}

// PhotoService orchestrates photo upload, processing, and management operations.
// It coordinates between storage layers, image processing, and album management
// to provide a complete photo management solution.
type PhotoService struct {
	s3Storage      S3StorageInterface
	photoStorage   PhotoStorageFullInterface
	imageProcessor *processor.ImageProcessor
	albumService   AlbumServiceInterface
}

// NewPhotoService creates a new PhotoService with required dependencies.
// All dependencies are validated to ensure proper service initialization.
//
// Parameters:
//   - s3Storage: Interface for S3 file operations
//   - photoStorage: Interface for photo metadata persistence
//   - imageProcessor: Service for image processing operations
//   - albumService: Service for album-related operations
//
// Returns:
//   - *PhotoService: Configured service ready for photo operations
//   - error: Validation error if required dependencies are missing
func NewPhotoService(
	s3Storage S3StorageInterface,
	photoStorage PhotoStorageFullInterface,
	imageProcessor *processor.ImageProcessor,
	albumService AlbumServiceInterface,
) (*PhotoService, error) {
	if s3Storage == nil {
		return nil, fmt.Errorf("s3Storage is required")
	}
	if photoStorage == nil {
		return nil, fmt.Errorf("photoStorage is required")
	}
	if imageProcessor == nil {
		return nil, fmt.Errorf("imageProcessor is required")
	}
	if albumService == nil {
		return nil, fmt.Errorf("albumService is required")
	}

	return &PhotoService{
		s3Storage:      s3Storage,
		photoStorage:   photoStorage,
		imageProcessor: imageProcessor,
		albumService:   albumService,
	}, nil
}

// UploadPhoto processes and stores a photo with all variants and metadata.
// The operation is atomic - if any step fails, cleanup is performed automatically.
func (s *PhotoService) UploadPhoto(req *photo.UploadRequest) (*photo.PhotoMetadata, error) {
	if err := s.validateUploadRequest(req); err != nil {
		return nil, fmt.Errorf("validating upload request: %w", err)
	}

	imageData, err := s.decodeImageData(req.ImageData)
	if err != nil {
		return nil, fmt.Errorf("decoding image data: %w", err)
	}

	processed, err := s.imageProcessor.ProcessImage(imageData)
	if err != nil {
		return nil, fmt.Errorf("processing image: %w", err)
	}

	photoID := uuid.New().String()
	storageKeys := s.generateStorageKeys(photoID, processed.Format)

	if err := s.uploadImageVariants(storageKeys, processed, req.ContentType); err != nil {
		return nil, fmt.Errorf("uploading image variants: %w", err)
	}

	metadata := s.createPhotoMetadata(photoID, req, storageKeys, processed)

	if err := s.photoStorage.SavePhoto(metadata); err != nil {
		s.cleanupS3Files(storageKeys.original, storageKeys.medium, storageKeys.thumbnail)
		return nil, fmt.Errorf("saving photo metadata: %w", err)
	}

	s.updateAlbumPhotoCount(req.AlbumID, 1)

	return metadata, nil
}

// validateUploadRequest validates the upload request fields.
func (s *PhotoService) validateUploadRequest(req *photo.UploadRequest) error {
	if req.AlbumID == "" {
		return fmt.Errorf("album ID is required")
	}
	
	return s.imageProcessor.ValidateImageFormat(req.ContentType)
}

// decodeImageData decodes base64 image data.
func (s *PhotoService) decodeImageData(imageData string) ([]byte, error) {
	return base64.StdEncoding.DecodeString(imageData)
}

// storageKeys holds S3 storage keys for different image variants.
type storageKeys struct {
	original  string
	medium    string
	thumbnail string
}

// generateStorageKeys creates S3 keys for all image variants.
func (s *PhotoService) generateStorageKeys(photoID string, format string) storageKeys {
	ext := s.imageProcessor.GetFileExtension(format)
	return storageKeys{
		original:  fmt.Sprintf("photos/original/%s%s", photoID, ext),
		medium:    fmt.Sprintf("photos/medium/%s%s", photoID, ext),
		thumbnail: fmt.Sprintf("photos/thumbnails/%s%s", photoID, ext),
	}
}

// uploadImageVariants uploads all image variants to S3.
func (s *PhotoService) uploadImageVariants(keys storageKeys, processed *processor.ProcessedImage, contentType string) error {
	uploads := []struct {
		key  string
		data []byte
	}{
		{keys.original, processed.Original},
		{keys.medium, processed.Medium},
		{keys.thumbnail, processed.Thumbnail},
	}

	for _, upload := range uploads {
		if err := s.s3Storage.UploadFile(upload.key, upload.data, contentType); err != nil {
			return fmt.Errorf("uploading %s: %w", upload.key, err)
		}
	}

	return nil
}

// createPhotoMetadata creates photo metadata from upload request and processed image.
func (s *PhotoService) createPhotoMetadata(photoID string, req *photo.UploadRequest, keys storageKeys, processed *processor.ProcessedImage) *photo.PhotoMetadata {
	return &photo.PhotoMetadata{
		ID:           photoID,
		AlbumID:      req.AlbumID,
		OriginalKey:  keys.original,
		MediumKey:    keys.medium,
		ThumbnailKey: keys.thumbnail,
		Title:        req.Title,
		Description:  req.Description,
		Tags:         req.Tags,
		UploadedAt:   time.Now().UTC(),
		FileSize:     int64(len(processed.Original)),
		Width:        processed.Width,
		Height:       processed.Height,
		ContentType:  req.ContentType,
	}
}

// updateAlbumPhotoCount updates the photo count for an album (best effort).
func (s *PhotoService) updateAlbumPhotoCount(albumID string, delta int) {
	if err := s.albumService.UpdateAlbumPhotoCount(albumID, delta); err != nil {
		// Log error but don't fail the operation
		fmt.Printf("Warning: failed to update album photo count for %s: %v\n", albumID, err)
	}
}

// ListPhotos retrieves all photos with count information.
func (s *PhotoService) ListPhotos() (*photo.ListPhotosResponse, error) {
	photos, err := s.photoStorage.ListPhotos()
	if err != nil {
		return nil, fmt.Errorf("listing photos: %w", err)
	}

	return &photo.ListPhotosResponse{
		Photos: photos,
		Count:  len(photos),
	}, nil
}

// ListPhotosByAlbum retrieves photos for a specific album.
func (s *PhotoService) ListPhotosByAlbum(albumID string) (*photo.ListPhotosResponse, error) {
	if albumID == "" {
		return nil, fmt.Errorf("album ID is required")
	}

	photos, err := s.photoStorage.ListPhotosByAlbum(albumID)
	if err != nil {
		return nil, fmt.Errorf("listing photos by album %s: %w", albumID, err)
	}

	return &photo.ListPhotosResponse{
		Photos: photos,
		Count:  len(photos),
	}, nil
}

// GetPhoto retrieves a photo by ID.
func (s *PhotoService) GetPhoto(id string) (*photo.PhotoMetadata, error) {
	if id == "" {
		return nil, fmt.Errorf("photo ID is required")
	}

	photoData, err := s.photoStorage.GetPhoto(id)
	if err != nil {
		return nil, fmt.Errorf("getting photo %s: %w", id, err)
	}

	return photoData, nil
}

// DeletePhoto removes a photo and all its associated files.
// The operation deletes metadata first, then cleans up S3 files.
func (s *PhotoService) DeletePhoto(id string) error {
	if id == "" {
		return fmt.Errorf("photo ID is required")
	}

	photoMeta, err := s.photoStorage.GetPhoto(id)
	if err != nil {
		return fmt.Errorf("getting photo for deletion: %w", err)
	}

	if err := s.photoStorage.DeletePhoto(id); err != nil {
		return fmt.Errorf("deleting photo metadata: %w", err)
	}

	if photoMeta.AlbumID != "" {
		s.updateAlbumPhotoCount(photoMeta.AlbumID, -1)
	}

	s.cleanupS3Files(photoMeta.OriginalKey, photoMeta.MediumKey, photoMeta.ThumbnailKey)

	return nil
}

// cleanupS3Files removes files from S3 storage (best effort).
// Errors are logged but don't cause the operation to fail.
func (s *PhotoService) cleanupS3Files(keys ...string) {
	for _, key := range keys {
		if key == "" {
			continue
		}
		if err := s.s3Storage.DeleteFile(key); err != nil {
			fmt.Printf("Warning: failed to delete S3 file %s: %v\n", key, err)
		}
	}
}