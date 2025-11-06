package storage

import (
	"testing"
	"time"

	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbiface"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"

	"photo-backend/internal/models/photo"
)

// MockDynamoDBAPI is a mock implementation of DynamoDB API
type MockDynamoDBAPI struct {
	dynamodbiface.DynamoDBAPI
	mock.Mock
}

func (m *MockDynamoDBAPI) PutItem(input *dynamodb.PutItemInput) (*dynamodb.PutItemOutput, error) {
	args := m.Called(input)
	return args.Get(0).(*dynamodb.PutItemOutput), args.Error(1)
}

func (m *MockDynamoDBAPI) GetItem(input *dynamodb.GetItemInput) (*dynamodb.GetItemOutput, error) {
	args := m.Called(input)
	return args.Get(0).(*dynamodb.GetItemOutput), args.Error(1)
}

func (m *MockDynamoDBAPI) Scan(input *dynamodb.ScanInput) (*dynamodb.ScanOutput, error) {
	args := m.Called(input)
	return args.Get(0).(*dynamodb.ScanOutput), args.Error(1)
}

func (m *MockDynamoDBAPI) Query(input *dynamodb.QueryInput) (*dynamodb.QueryOutput, error) {
	args := m.Called(input)
	return args.Get(0).(*dynamodb.QueryOutput), args.Error(1)
}

func (m *MockDynamoDBAPI) DeleteItem(input *dynamodb.DeleteItemInput) (*dynamodb.DeleteItemOutput, error) {
	args := m.Called(input)
	return args.Get(0).(*dynamodb.DeleteItemOutput), args.Error(1)
}

func (m *MockDynamoDBAPI) UpdateItem(input *dynamodb.UpdateItemInput) (*dynamodb.UpdateItemOutput, error) {
	args := m.Called(input)
	return args.Get(0).(*dynamodb.UpdateItemOutput), args.Error(1)
}

func TestPhotoStorage_SavePhoto(t *testing.T) {
	mockDB := new(MockDynamoDBAPI)
	storage := NewPhotoStorage(mockDB, "test-table")

	photoMeta := &photo.PhotoMetadata{
		ID:           "test-photo-id",
		AlbumID:      "test-album-id",
		OriginalKey:  "photos/original/test.jpg",
		ThumbnailKey: "photos/thumbnail/test.jpg",
		MediumKey:    "photos/medium/test.jpg",
		Title:        "Test Photo",
		Description:  "A test photo",
		Tags:         []string{"test", "photo"},
		UploadedAt:   time.Now().UTC(),
		FileSize:     1024,
		Width:        800,
		Height:       600,
		ContentType:  "image/jpeg",
	}

	mockDB.On("PutItem", mock.AnythingOfType("*dynamodb.PutItemInput")).Return(&dynamodb.PutItemOutput{}, nil)

	err := storage.SavePhoto(photoMeta)

	assert.NoError(t, err)
	mockDB.AssertExpectations(t)
}

func TestPhotoStorage_GetPhoto(t *testing.T) {
	mockDB := new(MockDynamoDBAPI)
	storage := NewPhotoStorage(mockDB, "test-table")

	photoMeta := &photo.PhotoMetadata{
		ID:           "test-photo-id",
		AlbumID:      "test-album-id",
		OriginalKey:  "photos/original/test.jpg",
		ThumbnailKey: "photos/thumbnail/test.jpg",
		MediumKey:    "photos/medium/test.jpg",
		Title:        "Test Photo",
		UploadedAt:   time.Now().UTC(),
		FileSize:     1024,
		Width:        800,
		Height:       600,
		ContentType:  "image/jpeg",
	}

	item, _ := dynamodbattribute.MarshalMap(photoMeta)
	mockDB.On("GetItem", mock.AnythingOfType("*dynamodb.GetItemInput")).Return(&dynamodb.GetItemOutput{
		Item: item,
	}, nil)

	result, err := storage.GetPhoto("test-photo-id")

	assert.NoError(t, err)
	assert.Equal(t, photoMeta.ID, result.ID)
	assert.Equal(t, photoMeta.AlbumID, result.AlbumID)
	assert.Equal(t, photoMeta.Title, result.Title)
	mockDB.AssertExpectations(t)
}

func TestPhotoStorage_ListPhotosByAlbum(t *testing.T) {
	mockDB := new(MockDynamoDBAPI)
	storage := NewPhotoStorage(mockDB, "test-table")

	photos := []photo.PhotoMetadata{
		{
			ID:          "photo1",
			AlbumID:     "test-album-id",
			Title:       "Photo 1",
			UploadedAt:  time.Now().UTC(),
			ContentType: "image/jpeg",
		},
		{
			ID:          "photo2",
			AlbumID:     "test-album-id",
			Title:       "Photo 2",
			UploadedAt:  time.Now().UTC().Add(-time.Hour),
			ContentType: "image/png",
		},
	}

	var items []map[string]*dynamodb.AttributeValue
	for _, p := range photos {
		item, _ := dynamodbattribute.MarshalMap(p)
		items = append(items, item)
	}

	mockDB.On("Query", mock.AnythingOfType("*dynamodb.QueryInput")).Return(&dynamodb.QueryOutput{
		Items: items,
	}, nil)

	result, err := storage.ListPhotosByAlbum("test-album-id")

	assert.NoError(t, err)
	assert.Len(t, result, 2)
	assert.Equal(t, "photo1", result[0].ID)
	assert.Equal(t, "photo2", result[1].ID)
	mockDB.AssertExpectations(t)
}

func TestPhotoStorage_DeletePhoto(t *testing.T) {
	mockDB := new(MockDynamoDBAPI)
	storage := NewPhotoStorage(mockDB, "test-table")

	mockDB.On("DeleteItem", mock.AnythingOfType("*dynamodb.DeleteItemInput")).Return(&dynamodb.DeleteItemOutput{}, nil)

	err := storage.DeletePhoto("test-photo-id")

	assert.NoError(t, err)
	mockDB.AssertExpectations(t)
}

func TestPhotoStorage_UpdatePhoto(t *testing.T) {
	mockDB := new(MockDynamoDBAPI)
	storage := NewPhotoStorage(mockDB, "test-table")

	photoMeta := &photo.PhotoMetadata{
		ID:          "test-photo-id",
		AlbumID:     "updated-album-id",
		Title:       "Updated Photo",
		UploadedAt:  time.Now().UTC(),
		ContentType: "image/jpeg",
	}

	mockDB.On("PutItem", mock.AnythingOfType("*dynamodb.PutItemInput")).Return(&dynamodb.PutItemOutput{}, nil)

	err := storage.UpdatePhoto(photoMeta)

	assert.NoError(t, err)
	mockDB.AssertExpectations(t)
}