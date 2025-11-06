package storage

import (
	"testing"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"

	"photo-backend/internal/models/photo"
)

func TestPhotoStorage_SavePhoto(t *testing.T) {
	mockDB := new(MockDynamoDBAPI)
	storage := NewPhotoStorage(mockDB, "test-photos-table")

	photoMeta := &photo.PhotoMetadata{
		ID:          "test-photo-id",
		AlbumID:     "test-album-id",
		OriginalKey: "photos/test-photo-id/original.jpg",
		ContentType: "image/jpeg",
		FileSize:    1024,
		Title:       "Test Photo",
		UploadedAt:  time.Now().UTC(),
	}

	mockDB.On("PutItem", mock.AnythingOfType("*dynamodb.PutItemInput")).Return(&dynamodb.PutItemOutput{}, nil)

	err := storage.SavePhoto(photoMeta)

	assert.NoError(t, err)
	mockDB.AssertExpectations(t)
}

func TestPhotoStorage_GetPhoto(t *testing.T) {
	mockDB := new(MockDynamoDBAPI)
	storage := NewPhotoStorage(mockDB, "test-photos-table")

	item := map[string]*dynamodb.AttributeValue{
		"id":           {S: aws.String("test-photo-id")},
		"filename":     {S: aws.String("test.jpg")},
		"content_type": {S: aws.String("image/jpeg")},
		"size":         {N: aws.String("1024")},
		"album_id":     {S: aws.String("test-album-id")},
		"user_email":   {S: aws.String("test@example.com")},
		"uploaded_at":  {S: aws.String(time.Now().UTC().Format(time.RFC3339))},
	}

	mockDB.On("GetItem", mock.AnythingOfType("*dynamodb.GetItemInput")).Return(&dynamodb.GetItemOutput{
		Item: item,
	}, nil)

	photo, err := storage.GetPhoto("test-photo-id")

	assert.NoError(t, err)
	assert.NotNil(t, photo)
	assert.Equal(t, "test-photo-id", photo.ID)
	mockDB.AssertExpectations(t)
}

func TestPhotoStorage_DeletePhoto(t *testing.T) {
	mockDB := new(MockDynamoDBAPI)
	storage := NewPhotoStorage(mockDB, "test-photos-table")

	mockDB.On("DeleteItem", mock.AnythingOfType("*dynamodb.DeleteItemInput")).Return(&dynamodb.DeleteItemOutput{}, nil)

	err := storage.DeletePhoto("test-photo-id")

	assert.NoError(t, err)
	mockDB.AssertExpectations(t)
}
