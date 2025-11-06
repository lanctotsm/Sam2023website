package storage

import (
	"testing"
	"time"

	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"

	"photo-backend/internal/models/album"
)

func TestAlbumStorage_SaveAlbum(t *testing.T) {
	mockDB := new(MockDynamoDBAPI)
	storage := NewAlbumStorage(mockDB, "test-albums-table")

	albumData := &album.Album{
		AlbumID:     "test-album-id",
		UserEmail:   "test@example.com",
		Name:        "Test Album",
		ThumbnailID: "test-photo-id",
		PhotoCount:  5,
		CreatedAt:   time.Now().UTC(),
		UpdatedAt:   time.Now().UTC(),
	}

	mockDB.On("PutItem", mock.AnythingOfType("*dynamodb.PutItemInput")).Return(&dynamodb.PutItemOutput{}, nil)

	err := storage.SaveAlbum(albumData)

	assert.NoError(t, err)
	mockDB.AssertExpectations(t)
}

func TestAlbumStorage_GetAlbum(t *testing.T) {
	mockDB := new(MockDynamoDBAPI)
	storage := NewAlbumStorage(mockDB, "test-albums-table")

	albumData := &album.Album{
		AlbumID:     "test-album-id",
		UserEmail:   "test@example.com",
		Name:        "Test Album",
		ThumbnailID: "test-photo-id",
		PhotoCount:  5,
		CreatedAt:   time.Now().UTC(),
		UpdatedAt:   time.Now().UTC(),
	}

	item, _ := dynamodbattribute.MarshalMap(albumData)
	mockDB.On("GetItem", mock.AnythingOfType("*dynamodb.GetItemInput")).Return(&dynamodb.GetItemOutput{
		Item: item,
	}, nil)

	result, err := storage.GetAlbum("test-album-id")

	assert.NoError(t, err)
	assert.Equal(t, albumData.AlbumID, result.AlbumID)
	assert.Equal(t, albumData.UserEmail, result.UserEmail)
	assert.Equal(t, albumData.Name, result.Name)
	assert.Equal(t, albumData.PhotoCount, result.PhotoCount)
	mockDB.AssertExpectations(t)
}

func TestAlbumStorage_GetAlbumByUserAndID(t *testing.T) {
	mockDB := new(MockDynamoDBAPI)
	storage := NewAlbumStorage(mockDB, "test-albums-table")

	albumData := &album.Album{
		AlbumID:   "test-album-id",
		UserEmail: "test@example.com",
		Name:      "Test Album",
		CreatedAt: time.Now().UTC(),
		UpdatedAt: time.Now().UTC(),
	}

	item, _ := dynamodbattribute.MarshalMap(albumData)
	mockDB.On("GetItem", mock.AnythingOfType("*dynamodb.GetItemInput")).Return(&dynamodb.GetItemOutput{
		Item: item,
	}, nil)

	// Test successful access
	result, err := storage.GetAlbumByUserAndID("test-album-id", "test@example.com")
	assert.NoError(t, err)
	assert.Equal(t, albumData.AlbumID, result.AlbumID)

	// Test access denied for different user
	_, err = storage.GetAlbumByUserAndID("test-album-id", "other@example.com")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "access denied")

	mockDB.AssertExpectations(t)
}

func TestAlbumStorage_ListAlbumsByUser(t *testing.T) {
	mockDB := new(MockDynamoDBAPI)
	storage := NewAlbumStorage(mockDB, "test-albums-table")

	albums := []album.Album{
		{
			AlbumID:    "album1",
			UserEmail:  "test@example.com",
			Name:       "Album 1",
			PhotoCount: 3,
			CreatedAt:  time.Now().UTC(),
			UpdatedAt:  time.Now().UTC(),
		},
		{
			AlbumID:    "album2",
			UserEmail:  "test@example.com",
			Name:       "Album 2",
			PhotoCount: 7,
			CreatedAt:  time.Now().UTC().Add(-time.Hour),
			UpdatedAt:  time.Now().UTC().Add(-time.Hour),
		},
	}

	var items []map[string]*dynamodb.AttributeValue
	for _, a := range albums {
		item, _ := dynamodbattribute.MarshalMap(a)
		items = append(items, item)
	}

	mockDB.On("Query", mock.AnythingOfType("*dynamodb.QueryInput")).Return(&dynamodb.QueryOutput{
		Items: items,
	}, nil)

	result, err := storage.ListAlbumsByUser("test@example.com")

	assert.NoError(t, err)
	assert.Len(t, result, 2)
	assert.Equal(t, "album1", result[0].AlbumID)
	assert.Equal(t, "album2", result[1].AlbumID)
	mockDB.AssertExpectations(t)
}

func TestAlbumStorage_ListAllAlbums(t *testing.T) {
	mockDB := new(MockDynamoDBAPI)
	storage := NewAlbumStorage(mockDB, "test-albums-table")

	albums := []album.Album{
		{
			AlbumID:    "album1",
			UserEmail:  "test@example.com",
			Name:       "Album 1",
			PhotoCount: 3,
			CreatedAt:  time.Now().UTC(),
			UpdatedAt:  time.Now().UTC(),
		},
		{
			AlbumID:    "album2",
			UserEmail:  "test@example.com",
			Name:       "Album 2",
			PhotoCount: 7,
			CreatedAt:  time.Now().UTC().Add(-time.Hour),
			UpdatedAt:  time.Now().UTC().Add(-time.Hour),
		},
	}

	var items []map[string]*dynamodb.AttributeValue
	for _, a := range albums {
		item, _ := dynamodbattribute.MarshalMap(a)
		items = append(items, item)
	}

	mockDB.On("Scan", mock.AnythingOfType("*dynamodb.ScanInput")).Return(&dynamodb.ScanOutput{
		Items: items,
	}, nil)

	result, err := storage.ListAllAlbums()

	assert.NoError(t, err)
	assert.Len(t, result, 2)
	mockDB.AssertExpectations(t)
}

func TestAlbumStorage_UpdateAlbumThumbnail(t *testing.T) {
	mockDB := new(MockDynamoDBAPI)
	storage := NewAlbumStorage(mockDB, "test-albums-table")

	mockDB.On("UpdateItem", mock.AnythingOfType("*dynamodb.UpdateItemInput")).Return(&dynamodb.UpdateItemOutput{}, nil)

	err := storage.UpdateAlbumThumbnail("test-album-id", "new-thumbnail-id")

	assert.NoError(t, err)
	mockDB.AssertExpectations(t)
}

func TestAlbumStorage_UpdateAlbumPhotoCount(t *testing.T) {
	mockDB := new(MockDynamoDBAPI)
	storage := NewAlbumStorage(mockDB, "test-albums-table")

	mockDB.On("UpdateItem", mock.AnythingOfType("*dynamodb.UpdateItemInput")).Return(&dynamodb.UpdateItemOutput{}, nil)

	// Test incrementing photo count
	err := storage.UpdateAlbumPhotoCount("test-album-id", 1)
	assert.NoError(t, err)

	// Test decrementing photo count
	err = storage.UpdateAlbumPhotoCount("test-album-id", -1)
	assert.NoError(t, err)

	mockDB.AssertExpectations(t)
}

func TestAlbumStorage_DeleteAlbum(t *testing.T) {
	mockDB := new(MockDynamoDBAPI)
	storage := NewAlbumStorage(mockDB, "test-albums-table")

	mockDB.On("DeleteItem", mock.AnythingOfType("*dynamodb.DeleteItemInput")).Return(&dynamodb.DeleteItemOutput{}, nil)

	err := storage.DeleteAlbum("test-album-id")

	assert.NoError(t, err)
	mockDB.AssertExpectations(t)
}

func TestAlbumStorage_DeleteAlbumByUserAndID(t *testing.T) {
	mockDB := new(MockDynamoDBAPI)
	storage := NewAlbumStorage(mockDB, "test-albums-table")

	// Test successful deletion (empty album)
	emptyAlbum := &album.Album{
		AlbumID:    "test-album-id",
		UserEmail:  "test@example.com",
		Name:       "Empty Album",
		PhotoCount: 0,
		CreatedAt:  time.Now().UTC(),
		UpdatedAt:  time.Now().UTC(),
	}

	item, _ := dynamodbattribute.MarshalMap(emptyAlbum)
	mockDB.On("GetItem", mock.AnythingOfType("*dynamodb.GetItemInput")).Return(&dynamodb.GetItemOutput{
		Item: item,
	}, nil).Once()
	mockDB.On("DeleteItem", mock.AnythingOfType("*dynamodb.DeleteItemInput")).Return(&dynamodb.DeleteItemOutput{}, nil).Once()

	err := storage.DeleteAlbumByUserAndID("test-album-id", "test@example.com")
	assert.NoError(t, err)

	// Test deletion failure (album with photos)
	albumWithPhotos := &album.Album{
		AlbumID:    "test-album-id-2",
		UserEmail:  "test@example.com",
		Name:       "Album with Photos",
		PhotoCount: 5,
		CreatedAt:  time.Now().UTC(),
		UpdatedAt:  time.Now().UTC(),
	}

	item2, _ := dynamodbattribute.MarshalMap(albumWithPhotos)
	mockDB.On("GetItem", mock.AnythingOfType("*dynamodb.GetItemInput")).Return(&dynamodb.GetItemOutput{
		Item: item2,
	}, nil).Once()

	err = storage.DeleteAlbumByUserAndID("test-album-id-2", "test@example.com")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "cannot delete album with photos")

	mockDB.AssertExpectations(t)
}