package storage

import (
	"testing"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"

	"photo-backend/internal/models/album"
)

func TestAlbumStorage_SaveAlbum(t *testing.T) {
	mockDB := new(MockDynamoDBAPI)
	storage := NewAlbumStorage(mockDB, "test-albums-table")

	albumData := &album.Album{
		AlbumID:    "test-album-id",
		Name:       "Test Album",
		UserEmail:  "test@example.com",
		PhotoCount: 0,
		CreatedAt:  time.Now().UTC(),
		UpdatedAt:  time.Now().UTC(),
	}

	mockDB.On("PutItem", mock.AnythingOfType("*dynamodb.PutItemInput")).Return(&dynamodb.PutItemOutput{}, nil)

	err := storage.SaveAlbum(albumData)

	assert.NoError(t, err)
	mockDB.AssertExpectations(t)
}

func TestAlbumStorage_GetAlbum(t *testing.T) {
	mockDB := new(MockDynamoDBAPI)
	storage := NewAlbumStorage(mockDB, "test-albums-table")

	item := map[string]*dynamodb.AttributeValue{
		"album_id":    {S: aws.String("test-album-id")},
		"name":        {S: aws.String("Test Album")},
		"user_email":  {S: aws.String("test@example.com")},
		"photo_count": {N: aws.String("0")},
		"created_at":  {S: aws.String(time.Now().UTC().Format(time.RFC3339))},
		"updated_at":  {S: aws.String(time.Now().UTC().Format(time.RFC3339))},
	}

	mockDB.On("GetItem", mock.AnythingOfType("*dynamodb.GetItemInput")).Return(&dynamodb.GetItemOutput{
		Item: item,
	}, nil)

	album, err := storage.GetAlbum("test-album-id")

	assert.NoError(t, err)
	assert.NotNil(t, album)
	assert.Equal(t, "test-album-id", album.AlbumID)
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
