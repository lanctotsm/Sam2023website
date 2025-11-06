package service

import (
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"

	"photo-backend/internal/models/album"
	"photo-backend/internal/models/photo"
)

// AlbumStorageInterface defines the interface for album storage operations
type AlbumStorageInterface interface {
	SaveAlbum(albumData *album.Album) error
	GetAlbum(albumID string) (*album.Album, error)
	GetAlbumByUserAndID(albumID, userEmail string) (*album.Album, error)
	ListAlbumsByUser(userEmail string) ([]album.Album, error)
	UpdateAlbum(albumData *album.Album) error
	UpdateAlbumThumbnail(albumID, thumbnailID string) error
	UpdateAlbumPhotoCount(albumID string, delta int) error
	DeleteAlbum(albumID string) error
	DeleteAlbumByUserAndID(albumID, userEmail string) error
}

// PhotoStorageInterface defines the interface for photo storage operations needed by album service
type PhotoStorageInterface interface {
	GetPhoto(id string) (*photo.PhotoMetadata, error)
	ListPhotosByAlbum(albumID string) ([]photo.PhotoMetadata, error)
}

// AlbumService handles album-related business logic
type AlbumService struct {
	albumStorage AlbumStorageInterface
	photoStorage PhotoStorageInterface
}

// NewAlbumService creates a new AlbumService instance
func NewAlbumService(albumStorage AlbumStorageInterface, photoStorage PhotoStorageInterface) *AlbumService {
	return &AlbumService{
		albumStorage: albumStorage,
		photoStorage: photoStorage,
	}
}

// CreateAlbum creates a new album
func (s *AlbumService) CreateAlbum(name string, userEmail string) (*album.Album, error) {
	// Validate album name
	if err := s.validateAlbumName(name); err != nil {
		return nil, fmt.Errorf("invalid album name: %w", err)
	}

	// Generate unique album ID
	albumID := uuid.New().String()

	// Create album
	now := time.Now().UTC()
	albumData := &album.Album{
		AlbumID:    albumID,
		UserEmail:  userEmail,
		Name:       strings.TrimSpace(name),
		PhotoCount: 0,
		CreatedAt:  now,
		UpdatedAt:  now,
	}

	// Save album
	if err := s.albumStorage.SaveAlbum(albumData); err != nil {
		return nil, fmt.Errorf("failed to save album: %w", err)
	}

	return albumData, nil
}

// ListAlbums retrieves all albums for a user
func (s *AlbumService) ListAlbums(userEmail string) ([]album.Album, error) {
	albums, err := s.albumStorage.ListAlbumsByUser(userEmail)
	if err != nil {
		return nil, fmt.Errorf("failed to list albums: %w", err)
	}

	return albums, nil
}

// GetAlbum retrieves a specific album by ID
func (s *AlbumService) GetAlbum(albumID string, userEmail string) (*album.Album, error) {
	album, err := s.albumStorage.GetAlbumByUserAndID(albumID, userEmail)
	if err != nil {
		return nil, fmt.Errorf("failed to get album: %w", err)
	}

	return album, nil
}

// SetAlbumThumbnail sets the thumbnail for an album
func (s *AlbumService) SetAlbumThumbnail(albumID string, photoID string, userEmail string) error {
	// Verify album ownership
	_, err := s.albumStorage.GetAlbumByUserAndID(albumID, userEmail)
	if err != nil {
		return fmt.Errorf("album not found or access denied: %w", err)
	}

	// Verify photo exists and belongs to the album
	photo, err := s.photoStorage.GetPhoto(photoID)
	if err != nil {
		return fmt.Errorf("photo not found: %w", err)
	}

	if photo.AlbumID != albumID {
		return fmt.Errorf("photo does not belong to this album")
	}

	// Update album thumbnail
	if err := s.albumStorage.UpdateAlbumThumbnail(albumID, photoID); err != nil {
		return fmt.Errorf("failed to update album thumbnail: %w", err)
	}

	return nil
}

// DeleteAlbum deletes an album
func (s *AlbumService) DeleteAlbum(albumID string, userEmail string) error {
	// Verify album ownership and check if it has photos
	if err := s.albumStorage.DeleteAlbumByUserAndID(albumID, userEmail); err != nil {
		return fmt.Errorf("failed to delete album: %w", err)
	}

	return nil
}

// UpdateAlbumPhotoCount updates the photo count for an album
func (s *AlbumService) UpdateAlbumPhotoCount(albumID string, delta int) error {
	return s.albumStorage.UpdateAlbumPhotoCount(albumID, delta)
}

// GetRandomThumbnailForAlbum gets a random photo from the album to use as thumbnail
func (s *AlbumService) GetRandomThumbnailForAlbum(albumID string) (*photo.PhotoMetadata, error) {
	photos, err := s.photoStorage.ListPhotosByAlbum(albumID)
	if err != nil {
		return nil, fmt.Errorf("failed to get photos for album: %w", err)
	}
	
	if len(photos) == 0 {
		return nil, nil // No photos in album
	}
	
	// Return the first photo (most recent) as thumbnail
	return &photos[0], nil
}

// ListAlbumsWithThumbnails retrieves all albums for a user with thumbnail information
func (s *AlbumService) ListAlbumsWithThumbnails(userEmail string) ([]album.AlbumWithThumbnail, error) {
	albums, err := s.albumStorage.ListAlbumsByUser(userEmail)
	if err != nil {
		return nil, fmt.Errorf("failed to list albums: %w", err)
	}

	var albumsWithThumbnails []album.AlbumWithThumbnail
	for _, albumData := range albums {
		albumWithThumbnail := album.AlbumWithThumbnail{
			Album: albumData,
		}

		// Get thumbnail URL if thumbnail is set or get random thumbnail
		if albumData.ThumbnailID != "" {
			// Use the specified thumbnail
			photo, err := s.photoStorage.GetPhoto(albumData.ThumbnailID)
			if err == nil && photo != nil {
				albumWithThumbnail.ThumbnailURL = photo.ThumbnailKey
			}
		} else {
			// Get random thumbnail from album photos
			randomPhoto, err := s.GetRandomThumbnailForAlbum(albumData.AlbumID)
			if err == nil && randomPhoto != nil {
				albumWithThumbnail.ThumbnailURL = randomPhoto.ThumbnailKey
			}
		}

		albumsWithThumbnails = append(albumsWithThumbnails, albumWithThumbnail)
	}

	return albumsWithThumbnails, nil
}

// validateAlbumName validates album name according to business rules
func (s *AlbumService) validateAlbumName(name string) error {
	name = strings.TrimSpace(name)
	
	if name == "" {
		return fmt.Errorf("album name cannot be empty")
	}
	
	if len(name) > 100 {
		return fmt.Errorf("album name cannot exceed 100 characters")
	}
	
	// Check for invalid characters (basic validation)
	invalidChars := []string{"<", ">", ":", "\"", "|", "?", "*"}
	for _, char := range invalidChars {
		if strings.Contains(name, char) {
			return fmt.Errorf("album name contains invalid character: %s", char)
		}
	}
	
	return nil
}