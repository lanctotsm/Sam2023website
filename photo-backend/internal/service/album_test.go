package service

import (
	"fmt"
	"testing"
	"time"

	"photo-backend/internal/models/album"
	"photo-backend/internal/models/photo"
)

// MockAlbumStorage implements album storage interface for testing
type MockAlbumStorage struct {
	albums map[string]*album.Album
}

func NewMockAlbumStorage() *MockAlbumStorage {
	return &MockAlbumStorage{
		albums: make(map[string]*album.Album),
	}
}

func (m *MockAlbumStorage) SaveAlbum(albumData *album.Album) error {
	m.albums[albumData.AlbumID] = albumData
	return nil
}

func (m *MockAlbumStorage) GetAlbum(albumID string) (*album.Album, error) {
	albumData, exists := m.albums[albumID]
	if !exists {
		return nil, fmt.Errorf("album not found")
	}
	return albumData, nil
}

func (m *MockAlbumStorage) GetAlbumByUserAndID(albumID, userEmail string) (*album.Album, error) {
	albumData, err := m.GetAlbum(albumID)
	if err != nil {
		return nil, err
	}
	if albumData.UserEmail != userEmail {
		return nil, fmt.Errorf("album not found or access denied")
	}
	return albumData, nil
}

func (m *MockAlbumStorage) ListAlbumsByUser(userEmail string) ([]album.Album, error) {
	var albums []album.Album
	for _, albumData := range m.albums {
		if albumData.UserEmail == userEmail {
			albums = append(albums, *albumData)
		}
	}
	return albums, nil
}

func (m *MockAlbumStorage) UpdateAlbum(albumData *album.Album) error {
	if _, exists := m.albums[albumData.AlbumID]; !exists {
		return fmt.Errorf("album not found")
	}
	m.albums[albumData.AlbumID] = albumData
	return nil
}

func (m *MockAlbumStorage) UpdateAlbumThumbnail(albumID, thumbnailID string) error {
	albumData, exists := m.albums[albumID]
	if !exists {
		return fmt.Errorf("album not found")
	}
	albumData.ThumbnailID = thumbnailID
	albumData.UpdatedAt = time.Now().UTC()
	return nil
}

func (m *MockAlbumStorage) UpdateAlbumPhotoCount(albumID string, delta int) error {
	albumData, exists := m.albums[albumID]
	if !exists {
		return fmt.Errorf("album not found")
	}
	albumData.PhotoCount += delta
	albumData.UpdatedAt = time.Now().UTC()
	return nil
}

func (m *MockAlbumStorage) DeleteAlbum(albumID string) error {
	delete(m.albums, albumID)
	return nil
}

func (m *MockAlbumStorage) DeleteAlbumByUserAndID(albumID, userEmail string) error {
	albumData, err := m.GetAlbumByUserAndID(albumID, userEmail)
	if err != nil {
		return err
	}
	if albumData.PhotoCount > 0 {
		return fmt.Errorf("cannot delete album with photos")
	}
	return m.DeleteAlbum(albumID)
}

// MockPhotoStorage implements photo storage interface for testing
type MockPhotoStorage struct {
	photos map[string]*photo.PhotoMetadata
}

func NewMockPhotoStorage() *MockPhotoStorage {
	return &MockPhotoStorage{
		photos: make(map[string]*photo.PhotoMetadata),
	}
}

func (m *MockPhotoStorage) GetPhoto(id string) (*photo.PhotoMetadata, error) {
	photoData, exists := m.photos[id]
	if !exists {
		return nil, fmt.Errorf("photo not found")
	}
	return photoData, nil
}

func (m *MockPhotoStorage) ListPhotosByAlbum(albumID string) ([]photo.PhotoMetadata, error) {
	var photos []photo.PhotoMetadata
	for _, photoData := range m.photos {
		if photoData.AlbumID == albumID {
			photos = append(photos, *photoData)
		}
	}
	
	// Sort by upload date descending (newest first) to match real implementation
	for i := 0; i < len(photos)-1; i++ {
		for j := i + 1; j < len(photos); j++ {
			if photos[i].UploadedAt.Before(photos[j].UploadedAt) {
				photos[i], photos[j] = photos[j], photos[i]
			}
		}
	}
	
	return photos, nil
}

func (m *MockPhotoStorage) SavePhoto(photoData *photo.PhotoMetadata) error {
	m.photos[photoData.ID] = photoData
	return nil
}

func TestAlbumService_CreateAlbum(t *testing.T) {
	mockAlbumStorage := NewMockAlbumStorage()
	mockPhotoStorage := NewMockPhotoStorage()
	albumService := NewAlbumService(mockAlbumStorage, mockPhotoStorage)

	userEmail := "test@example.com"
	albumName := "Test Album"

	// Test successful album creation
	albumData, err := albumService.CreateAlbum(albumName, userEmail)
	if err != nil {
		t.Fatalf("CreateAlbum failed: %v", err)
	}

	// Verify album properties
	if albumData.Name != albumName {
		t.Errorf("Expected album name '%s', got '%s'", albumName, albumData.Name)
	}
	if albumData.UserEmail != userEmail {
		t.Errorf("Expected user email '%s', got '%s'", userEmail, albumData.UserEmail)
	}
	if albumData.AlbumID == "" {
		t.Error("Album ID should not be empty")
	}
	if albumData.PhotoCount != 0 {
		t.Errorf("Expected photo count 0, got %d", albumData.PhotoCount)
	}

	// Verify album is saved in storage
	savedAlbum, err := mockAlbumStorage.GetAlbum(albumData.AlbumID)
	if err != nil {
		t.Fatalf("Album not found in storage: %v", err)
	}
	if savedAlbum.Name != albumName {
		t.Errorf("Saved album name mismatch: expected '%s', got '%s'", albumName, savedAlbum.Name)
	}
}

func TestAlbumService_CreateAlbum_ValidationErrors(t *testing.T) {
	mockAlbumStorage := NewMockAlbumStorage()
	mockPhotoStorage := NewMockPhotoStorage()
	albumService := NewAlbumService(mockAlbumStorage, mockPhotoStorage)

	userEmail := "test@example.com"

	testCases := []struct {
		name        string
		albumName   string
		expectError bool
	}{
		{"Empty name", "", true},
		{"Whitespace only", "   ", true},
		{"Valid name", "Valid Album", false},
		{"Long name", string(make([]byte, 101)), true}, // 101 characters
		{"Name with invalid chars", "Album<>Name", true},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			_, err := albumService.CreateAlbum(tc.albumName, userEmail)
			if tc.expectError && err == nil {
				t.Errorf("Expected error for album name '%s'", tc.albumName)
			}
			if !tc.expectError && err != nil {
				t.Errorf("Unexpected error for album name '%s': %v", tc.albumName, err)
			}
		})
	}
}

func TestAlbumService_ListAlbums(t *testing.T) {
	mockAlbumStorage := NewMockAlbumStorage()
	mockPhotoStorage := NewMockPhotoStorage()
	albumService := NewAlbumService(mockAlbumStorage, mockPhotoStorage)

	userEmail := "test@example.com"
	otherUserEmail := "other@example.com"

	// Create albums for test user
	album1, _ := albumService.CreateAlbum("Album 1", userEmail)
	album2, _ := albumService.CreateAlbum("Album 2", userEmail)

	// Create album for other user
	albumService.CreateAlbum("Other Album", otherUserEmail)

	// List albums for test user
	albums, err := albumService.ListAlbums(userEmail)
	if err != nil {
		t.Fatalf("ListAlbums failed: %v", err)
	}

	// Should only return albums for the specified user
	if len(albums) != 2 {
		t.Errorf("Expected 2 albums, got %d", len(albums))
	}

	// Verify correct albums are returned
	albumIDs := make(map[string]bool)
	for _, albumData := range albums {
		albumIDs[albumData.AlbumID] = true
		if albumData.UserEmail != userEmail {
			t.Errorf("Album should belong to user '%s', got '%s'", userEmail, albumData.UserEmail)
		}
	}

	if !albumIDs[album1.AlbumID] {
		t.Error("Album1 should be in the list")
	}
	if !albumIDs[album2.AlbumID] {
		t.Error("Album2 should be in the list")
	}
}

func TestAlbumService_GetAlbum(t *testing.T) {
	mockAlbumStorage := NewMockAlbumStorage()
	mockPhotoStorage := NewMockPhotoStorage()
	albumService := NewAlbumService(mockAlbumStorage, mockPhotoStorage)

	userEmail := "test@example.com"
	otherUserEmail := "other@example.com"

	// Create album
	createdAlbum, _ := albumService.CreateAlbum("Test Album", userEmail)

	// Test successful retrieval
	retrievedAlbum, err := albumService.GetAlbum(createdAlbum.AlbumID, userEmail)
	if err != nil {
		t.Fatalf("GetAlbum failed: %v", err)
	}
	if retrievedAlbum.AlbumID != createdAlbum.AlbumID {
		t.Errorf("Expected album ID '%s', got '%s'", createdAlbum.AlbumID, retrievedAlbum.AlbumID)
	}

	// Test access denied for other user
	_, err = albumService.GetAlbum(createdAlbum.AlbumID, otherUserEmail)
	if err == nil {
		t.Error("Should not allow access to other user's album")
	}

	// Test non-existent album
	_, err = albumService.GetAlbum("non-existent", userEmail)
	if err == nil {
		t.Error("Should return error for non-existent album")
	}
}

func TestAlbumService_SetAlbumThumbnail(t *testing.T) {
	mockAlbumStorage := NewMockAlbumStorage()
	mockPhotoStorage := NewMockPhotoStorage()
	albumService := NewAlbumService(mockAlbumStorage, mockPhotoStorage)

	userEmail := "test@example.com"

	// Create album
	createdAlbum, _ := albumService.CreateAlbum("Test Album", userEmail)

	// Create photo in the album
	photoData := &photo.PhotoMetadata{
		ID:      "photo-1",
		AlbumID: createdAlbum.AlbumID,
	}
	mockPhotoStorage.SavePhoto(photoData)

	// Test successful thumbnail setting
	err := albumService.SetAlbumThumbnail(createdAlbum.AlbumID, "photo-1", userEmail)
	if err != nil {
		t.Fatalf("SetAlbumThumbnail failed: %v", err)
	}

	// Verify thumbnail was set
	updatedAlbum, _ := albumService.GetAlbum(createdAlbum.AlbumID, userEmail)
	if updatedAlbum.ThumbnailID != "photo-1" {
		t.Errorf("Expected thumbnail ID 'photo-1', got '%s'", updatedAlbum.ThumbnailID)
	}

	// Test with non-existent photo
	err = albumService.SetAlbumThumbnail(createdAlbum.AlbumID, "non-existent", userEmail)
	if err == nil {
		t.Error("Should return error for non-existent photo")
	}

	// Test with photo from different album
	otherPhotoData := &photo.PhotoMetadata{
		ID:      "photo-2",
		AlbumID: "other-album",
	}
	mockPhotoStorage.SavePhoto(otherPhotoData)

	err = albumService.SetAlbumThumbnail(createdAlbum.AlbumID, "photo-2", userEmail)
	if err == nil {
		t.Error("Should return error for photo from different album")
	}
}

func TestAlbumService_DeleteAlbum(t *testing.T) {
	mockAlbumStorage := NewMockAlbumStorage()
	mockPhotoStorage := NewMockPhotoStorage()
	albumService := NewAlbumService(mockAlbumStorage, mockPhotoStorage)

	userEmail := "test@example.com"
	otherUserEmail := "other@example.com"

	// Create empty album
	emptyAlbum, _ := albumService.CreateAlbum("Empty Album", userEmail)

	// Create album with photos
	albumWithPhotos, _ := albumService.CreateAlbum("Album with Photos", userEmail)
	mockAlbumStorage.UpdateAlbumPhotoCount(albumWithPhotos.AlbumID, 1) // Simulate having photos

	// Test successful deletion of empty album
	err := albumService.DeleteAlbum(emptyAlbum.AlbumID, userEmail)
	if err != nil {
		t.Fatalf("DeleteAlbum failed: %v", err)
	}

	// Verify album is deleted
	_, err = albumService.GetAlbum(emptyAlbum.AlbumID, userEmail)
	if err == nil {
		t.Error("Album should have been deleted")
	}

	// Test deletion of album with photos (should fail)
	err = albumService.DeleteAlbum(albumWithPhotos.AlbumID, userEmail)
	if err == nil {
		t.Error("Should not allow deletion of album with photos")
	}

	// Test access denied for other user
	otherAlbum, _ := albumService.CreateAlbum("Other Album", otherUserEmail)
	err = albumService.DeleteAlbum(otherAlbum.AlbumID, userEmail)
	if err == nil {
		t.Error("Should not allow deletion of other user's album")
	}
}

func TestAlbumService_GetRandomThumbnailForAlbum(t *testing.T) {
	mockAlbumStorage := NewMockAlbumStorage()
	mockPhotoStorage := NewMockPhotoStorage()
	albumService := NewAlbumService(mockAlbumStorage, mockPhotoStorage)

	userEmail := "test@example.com"

	// Create album
	createdAlbum, _ := albumService.CreateAlbum("Test Album", userEmail)

	// Test with empty album
	thumbnail, err := albumService.GetRandomThumbnailForAlbum(createdAlbum.AlbumID)
	if err != nil {
		t.Fatalf("GetRandomThumbnailForAlbum failed: %v", err)
	}
	if thumbnail != nil {
		t.Error("Empty album should return nil thumbnail")
	}

	// Add photos to album
	photo1 := &photo.PhotoMetadata{
		ID:         "photo-1",
		AlbumID:    createdAlbum.AlbumID,
		UploadedAt: time.Now().UTC(),
	}
	photo2 := &photo.PhotoMetadata{
		ID:         "photo-2",
		AlbumID:    createdAlbum.AlbumID,
		UploadedAt: time.Now().UTC().Add(-1 * time.Hour), // Older photo
	}
	mockPhotoStorage.SavePhoto(photo1)
	mockPhotoStorage.SavePhoto(photo2)

	// Test with photos in album
	thumbnail, err = albumService.GetRandomThumbnailForAlbum(createdAlbum.AlbumID)
	if err != nil {
		t.Fatalf("GetRandomThumbnailForAlbum failed: %v", err)
	}
	if thumbnail == nil {
		t.Error("Album with photos should return a thumbnail")
	}

	// Should return the first photo (most recent)
	if thumbnail.ID != "photo-1" {
		t.Errorf("Expected thumbnail ID 'photo-1', got '%s'", thumbnail.ID)
	}
}

func TestAlbumService_ListAlbumsWithThumbnails(t *testing.T) {
	mockAlbumStorage := NewMockAlbumStorage()
	mockPhotoStorage := NewMockPhotoStorage()
	albumService := NewAlbumService(mockAlbumStorage, mockPhotoStorage)

	userEmail := "test@example.com"

	// Create albums
	album1, _ := albumService.CreateAlbum("Album 1", userEmail)
	album2, _ := albumService.CreateAlbum("Album 2", userEmail)

	// Add photo to album1
	photo1 := &photo.PhotoMetadata{
		ID:           "photo-1",
		AlbumID:      album1.AlbumID,
		ThumbnailKey: "thumbnail-key-1",
	}
	mockPhotoStorage.SavePhoto(photo1)

	// Set explicit thumbnail for album2
	photo2 := &photo.PhotoMetadata{
		ID:           "photo-2",
		AlbumID:      album2.AlbumID,
		ThumbnailKey: "thumbnail-key-2",
	}
	mockPhotoStorage.SavePhoto(photo2)
	albumService.SetAlbumThumbnail(album2.AlbumID, "photo-2", userEmail)

	// Test listing albums with thumbnails
	albumsWithThumbnails, err := albumService.ListAlbumsWithThumbnails(userEmail)
	if err != nil {
		t.Fatalf("ListAlbumsWithThumbnails failed: %v", err)
	}

	if len(albumsWithThumbnails) != 2 {
		t.Errorf("Expected 2 albums, got %d", len(albumsWithThumbnails))
	}

	// Find albums in response
	var album1Response, album2Response *album.AlbumWithThumbnail
	for i := range albumsWithThumbnails {
		if albumsWithThumbnails[i].Album.AlbumID == album1.AlbumID {
			album1Response = &albumsWithThumbnails[i]
		}
		if albumsWithThumbnails[i].Album.AlbumID == album2.AlbumID {
			album2Response = &albumsWithThumbnails[i]
		}
	}

	// Verify album1 has random thumbnail
	if album1Response == nil {
		t.Error("Album1 should be in response")
	} else if album1Response.ThumbnailURL != "thumbnail-key-1" {
		t.Errorf("Expected album1 thumbnail URL 'thumbnail-key-1', got '%s'", album1Response.ThumbnailURL)
	}

	// Verify album2 has explicit thumbnail
	if album2Response == nil {
		t.Error("Album2 should be in response")
	} else if album2Response.ThumbnailURL != "thumbnail-key-2" {
		t.Errorf("Expected album2 thumbnail URL 'thumbnail-key-2', got '%s'", album2Response.ThumbnailURL)
	}
}

func TestAlbumService_UpdateAlbumPhotoCount(t *testing.T) {
	mockAlbumStorage := NewMockAlbumStorage()
	mockPhotoStorage := NewMockPhotoStorage()
	albumService := NewAlbumService(mockAlbumStorage, mockPhotoStorage)

	userEmail := "test@example.com"

	// Create album
	createdAlbum, _ := albumService.CreateAlbum("Test Album", userEmail)

	// Test incrementing photo count
	err := albumService.UpdateAlbumPhotoCount(createdAlbum.AlbumID, 1)
	if err != nil {
		t.Fatalf("UpdateAlbumPhotoCount failed: %v", err)
	}

	// Verify photo count was updated
	updatedAlbum, _ := albumService.GetAlbum(createdAlbum.AlbumID, userEmail)
	if updatedAlbum.PhotoCount != 1 {
		t.Errorf("Expected photo count 1, got %d", updatedAlbum.PhotoCount)
	}

	// Test decrementing photo count
	err = albumService.UpdateAlbumPhotoCount(createdAlbum.AlbumID, -1)
	if err != nil {
		t.Fatalf("UpdateAlbumPhotoCount failed: %v", err)
	}

	// Verify photo count was decremented
	updatedAlbum, _ = albumService.GetAlbum(createdAlbum.AlbumID, userEmail)
	if updatedAlbum.PhotoCount != 0 {
		t.Errorf("Expected photo count 0, got %d", updatedAlbum.PhotoCount)
	}

	// Test with non-existent album
	err = albumService.UpdateAlbumPhotoCount("non-existent", 1)
	if err == nil {
		t.Error("Should return error for non-existent album")
	}
}