package service

import (
	"fmt"
	"testing"
	"time"

	"photo-backend/internal/models/album"
	"photo-backend/internal/models/photo"
	"photo-backend/internal/processor"
)

// MockS3Storage is a mock implementation of S3Storage for testing
type MockS3Storage struct {
	uploadedFiles map[string][]byte
	uploadError   error
}

func NewMockS3Storage() *MockS3Storage {
	return &MockS3Storage{
		uploadedFiles: make(map[string][]byte),
	}
}

func (m *MockS3Storage) UploadFile(key string, data []byte, contentType string) error {
	if m.uploadError != nil {
		return m.uploadError
	}
	m.uploadedFiles[key] = data
	return nil
}

func (m *MockS3Storage) DeleteFile(key string) error {
	delete(m.uploadedFiles, key)
	return nil
}

func (m *MockS3Storage) GetFileURL(key string) string {
	return "https://example.com/" + key
}

// Extend existing MockPhotoStorage with additional methods needed for photo service tests
func (m *MockPhotoStorage) ListPhotos() ([]photo.PhotoMetadata, error) {
	var photos []photo.PhotoMetadata
	for _, p := range m.photos {
		photos = append(photos, *p)
	}
	return photos, nil
}

func (m *MockPhotoStorage) DeletePhoto(id string) error {
	delete(m.photos, id)
	return nil
}

// For testing, we'll use the real ImageProcessor since it's simple enough
// and doesn't have external dependencies



// MockAlbumValidator is a mock implementation of AlbumValidatorInterface for testing
type MockAlbumValidator struct {
	albumExists bool
	updateError error
}

func NewMockAlbumValidator() *MockAlbumValidator {
	return &MockAlbumValidator{
		albumExists: true,
	}
}

func (m *MockAlbumValidator) GetAlbum(albumID string, userEmail string) (*album.Album, error) {
	if !m.albumExists {
		return nil, fmt.Errorf("album not found")
	}
	return &album.Album{
		AlbumID: albumID,
		Name:    "Test Album",
	}, nil
}

func (m *MockAlbumValidator) UpdateAlbumPhotoCount(albumID string, delta int) error {
	return m.updateError
}

func TestPhotoService_UploadPhoto(t *testing.T) {
	// Setup mocks
	s3Storage := NewMockS3Storage()
	photoStorage := NewMockPhotoStorage()
	imageProcessor := processor.NewImageProcessor()
	albumValidator := NewMockAlbumValidator()

	// Create service
	service, err := NewPhotoService(s3Storage, photoStorage, imageProcessor, albumValidator)
	if err != nil {
		t.Fatalf("Failed to create photo service: %v", err)
	}

	// Test data - create a simple 1x1 pixel PNG image
	// This is a minimal valid PNG image in base64 (1x1 transparent pixel)
	minimalPNG := "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
	
	uploadReq := &photo.UploadRequest{
		AlbumID:     "test-album-id",
		ImageData:   minimalPNG,
		ContentType: "image/png",
		Title:       "Test Photo",
		Description: "A test photo",
		Tags:        []string{"test", "photo"},
	}

	// Test successful upload
	metadata, err := service.UploadPhoto(uploadReq)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if metadata == nil {
		t.Fatal("Expected metadata, got nil")
	}

	if metadata.AlbumID != uploadReq.AlbumID {
		t.Errorf("Expected AlbumID %s, got %s", uploadReq.AlbumID, metadata.AlbumID)
	}

	if metadata.Title != uploadReq.Title {
		t.Errorf("Expected Title %s, got %s", uploadReq.Title, metadata.Title)
	}

	// Verify photo was saved
	savedPhoto, err := photoStorage.GetPhoto(metadata.ID)
	if err != nil {
		t.Fatalf("Failed to get saved photo: %v", err)
	}

	if savedPhoto.AlbumID != uploadReq.AlbumID {
		t.Errorf("Expected saved photo AlbumID %s, got %s", uploadReq.AlbumID, savedPhoto.AlbumID)
	}
}

func TestPhotoService_UploadPhoto_MissingAlbumID(t *testing.T) {
	// Setup mocks
	s3Storage := NewMockS3Storage()
	photoStorage := NewMockPhotoStorage()
	imageProcessor := processor.NewImageProcessor()
	albumValidator := NewMockAlbumValidator()

	// Create service
	service, err := NewPhotoService(s3Storage, photoStorage, imageProcessor, albumValidator)
	if err != nil {
		t.Fatalf("Failed to create photo service: %v", err)
	}

	// Test data without AlbumID
	uploadReq := &photo.UploadRequest{
		ImageData:   "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
		ContentType: "image/png",
		Title:       "Test Photo",
	}

	// Test upload should fail
	_, uploadErr := service.UploadPhoto(uploadReq)
	if uploadErr == nil {
		t.Fatal("Expected error for missing AlbumID, got nil")
	}

	if uploadErr.Error() != "validating upload request: album ID is required" {
		t.Errorf("Expected 'validating upload request: album ID is required' error, got %v", uploadErr)
	}
}

func TestPhotoService_ListPhotosByAlbum(t *testing.T) {
	// Setup mocks
	s3Storage := NewMockS3Storage()
	photoStorage := NewMockPhotoStorage()
	imageProcessor := processor.NewImageProcessor()
	albumValidator := NewMockAlbumValidator()

	// Create service
	service, err := NewPhotoService(s3Storage, photoStorage, imageProcessor, albumValidator)
	if err != nil {
		t.Fatalf("Failed to create photo service: %v", err)
	}

	// Add test photos to storage
	testPhotos := []*photo.PhotoMetadata{
		{
			ID:          "photo1",
			AlbumID:     "album1",
			Title:       "Photo 1",
			UploadedAt:  time.Now(),
		},
		{
			ID:          "photo2",
			AlbumID:     "album1",
			Title:       "Photo 2",
			UploadedAt:  time.Now(),
		},
		{
			ID:          "photo3",
			AlbumID:     "album2",
			Title:       "Photo 3",
			UploadedAt:  time.Now(),
		},
	}

	for _, p := range testPhotos {
		photoStorage.SavePhoto(p)
	}

	// Test listing photos by album
	response, err := service.ListPhotosByAlbum("album1")
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if response.Count != 2 {
		t.Errorf("Expected 2 photos for album1, got %d", response.Count)
	}

	// Verify all returned photos belong to the correct album
	for _, p := range response.Photos {
		if p.AlbumID != "album1" {
			t.Errorf("Expected photo to belong to album1, got %s", p.AlbumID)
		}
	}
}