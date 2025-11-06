package storage

import (
	"testing"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"

	"photo-backend/internal/models/auth"
)

func TestSessionStorage_SaveSession(t *testing.T) {
	mockDB := new(MockDynamoDBAPI)
	storage := NewSessionStorage(mockDB, "test-sessions-table")

	session := &auth.Session{
		SessionToken: "test-session-token",
		UserEmail:    "test@example.com",
		CreatedAt:    time.Now().UTC(),
		ExpiresAt:    time.Now().UTC().Add(24 * time.Hour),
		LastActivity: time.Now().UTC(),
	}

	mockDB.On("PutItemWithContext", mock.Anything, mock.AnythingOfType("*dynamodb.PutItemInput"), mock.Anything).Return(&dynamodb.PutItemOutput{}, nil)

	err := storage.SaveSession(session)

	assert.NoError(t, err)
	mockDB.AssertExpectations(t)
}

func TestSessionStorage_GetSession(t *testing.T) {
	mockDB := new(MockDynamoDBAPI)
	storage := NewSessionStorage(mockDB, "test-sessions-table")

	futureTime := time.Now().UTC().Add(24 * time.Hour)
	item := map[string]*dynamodb.AttributeValue{
		"session_token": {S: aws.String("test-session-token")},
		"user_email":    {S: aws.String("test@example.com")},
		"created_at":    {S: aws.String(time.Now().UTC().Format(time.RFC3339))},
		"expires_at":    {S: aws.String(futureTime.Format(time.RFC3339))},
		"last_activity": {S: aws.String(time.Now().UTC().Format(time.RFC3339))},
	}

	mockDB.On("GetItemWithContext", mock.Anything, mock.AnythingOfType("*dynamodb.GetItemInput"), mock.Anything).Return(&dynamodb.GetItemOutput{
		Item: item,
	}, nil)

	session, err := storage.GetSession("test-session-token")

	assert.NoError(t, err)
	assert.NotNil(t, session)
	assert.Equal(t, "test-session-token", session.SessionToken)
	mockDB.AssertExpectations(t)
}

func TestSessionStorage_DeleteSession(t *testing.T) {
	mockDB := new(MockDynamoDBAPI)
	storage := NewSessionStorage(mockDB, "test-sessions-table")

	mockDB.On("DeleteItemWithContext", mock.Anything, mock.AnythingOfType("*dynamodb.DeleteItemInput"), mock.Anything).Return(&dynamodb.DeleteItemOutput{}, nil)

	err := storage.DeleteSession("test-session-token")

	assert.NoError(t, err)
	mockDB.AssertExpectations(t)
}
