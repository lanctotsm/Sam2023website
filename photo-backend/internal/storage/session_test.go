package storage

import (
	"testing"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
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

	mockDB.On("PutItem", mock.AnythingOfType("*dynamodb.PutItemInput")).Return(&dynamodb.PutItemOutput{}, nil)

	err := storage.SaveSession(session)

	assert.NoError(t, err)
	mockDB.AssertExpectations(t)
}

func TestSessionStorage_GetSession(t *testing.T) {
	mockDB := new(MockDynamoDBAPI)
	storage := NewSessionStorage(mockDB, "test-sessions-table")

	session := &auth.Session{
		SessionToken: "test-session-token",
		UserEmail:    "test@example.com",
		CreatedAt:    time.Now().UTC(),
		ExpiresAt:    time.Now().UTC().Add(24 * time.Hour),
		LastActivity: time.Now().UTC(),
	}

	// Create item manually to match the SaveSession format
	item := map[string]*dynamodb.AttributeValue{
		"session_token": {S: aws.String(session.SessionToken)},
		"user_email":    {S: aws.String(session.UserEmail)},
		"created_at":    {S: aws.String(session.CreatedAt.Format(time.RFC3339))},
		"expires_at":    {S: aws.String(session.ExpiresAt.Format(time.RFC3339))}, // Keep as string for unmarshaling
		"last_activity": {S: aws.String(session.LastActivity.Format(time.RFC3339))},
	}

	mockDB.On("GetItem", mock.AnythingOfType("*dynamodb.GetItemInput")).Return(&dynamodb.GetItemOutput{
		Item: item,
	}, nil)

	result, err := storage.GetSession("test-session-token")

	assert.NoError(t, err)
	assert.Equal(t, session.SessionToken, result.SessionToken)
	assert.Equal(t, session.UserEmail, result.UserEmail)
	mockDB.AssertExpectations(t)
}

func TestSessionStorage_UpdateSession(t *testing.T) {
	mockDB := new(MockDynamoDBAPI)
	storage := NewSessionStorage(mockDB, "test-sessions-table")

	session := &auth.Session{
		SessionToken: "test-session-token",
		UserEmail:    "test@example.com",
		ExpiresAt:    time.Now().UTC().Add(24 * time.Hour),
		LastActivity: time.Now().UTC(),
	}

	mockDB.On("UpdateItem", mock.AnythingOfType("*dynamodb.UpdateItemInput")).Return(&dynamodb.UpdateItemOutput{}, nil)

	err := storage.UpdateSession(session)

	assert.NoError(t, err)
	mockDB.AssertExpectations(t)
}

func TestSessionStorage_DeleteSession(t *testing.T) {
	mockDB := new(MockDynamoDBAPI)
	storage := NewSessionStorage(mockDB, "test-sessions-table")

	mockDB.On("DeleteItem", mock.AnythingOfType("*dynamodb.DeleteItemInput")).Return(&dynamodb.DeleteItemOutput{}, nil)

	err := storage.DeleteSession("test-session-token")

	assert.NoError(t, err)
	mockDB.AssertExpectations(t)
}

func TestSessionStorage_ListSessionsByUser(t *testing.T) {
	mockDB := new(MockDynamoDBAPI)
	storage := NewSessionStorage(mockDB, "test-sessions-table")

	sessions := []auth.Session{
		{
			SessionToken: "session1",
			UserEmail:    "test@example.com",
			CreatedAt:    time.Now().UTC(),
			ExpiresAt:    time.Now().UTC().Add(24 * time.Hour),
			LastActivity: time.Now().UTC(),
		},
		{
			SessionToken: "session2",
			UserEmail:    "test@example.com",
			CreatedAt:    time.Now().UTC().Add(-time.Hour),
			ExpiresAt:    time.Now().UTC().Add(23 * time.Hour),
			LastActivity: time.Now().UTC().Add(-time.Minute),
		},
	}

	var items []map[string]*dynamodb.AttributeValue
	for _, s := range sessions {
		item, _ := dynamodbattribute.MarshalMap(s)
		items = append(items, item)
	}

	mockDB.On("Query", mock.AnythingOfType("*dynamodb.QueryInput")).Return(&dynamodb.QueryOutput{
		Items: items,
	}, nil)

	result, err := storage.ListSessionsByUser("test@example.com")

	assert.NoError(t, err)
	assert.Len(t, result, 2)
	mockDB.AssertExpectations(t)
}

func TestSessionStorage_SaveOAuthState(t *testing.T) {
	mockDB := new(MockDynamoDBAPI)
	storage := NewSessionStorage(mockDB, "test-sessions-table")

	state := &auth.OAuthState{
		State:     "test-oauth-state",
		CreatedAt: time.Now().UTC(),
		ExpiresAt: time.Now().UTC().Add(5 * time.Minute),
	}

	mockDB.On("PutItem", mock.AnythingOfType("*dynamodb.PutItemInput")).Return(&dynamodb.PutItemOutput{}, nil)

	err := storage.SaveOAuthState(state)

	assert.NoError(t, err)
	mockDB.AssertExpectations(t)
}

func TestSessionStorage_GetOAuthState(t *testing.T) {
	mockDB := new(MockDynamoDBAPI)
	storage := NewSessionStorage(mockDB, "test-sessions-table")

	// Mock valid state
	item := map[string]*dynamodb.AttributeValue{
		"session_token": {S: aws.String("oauth_state_test-state")},
		"user_email":    {S: aws.String("oauth_state")},
		"verifier":      {S: aws.String("test-verifier-12345")},
		"created_at":    {S: aws.String(time.Now().UTC().Format(time.RFC3339))},
		"expires_at":    {N: aws.String("9999999999")}, // Future expiration
	}

	mockDB.On("GetItem", mock.AnythingOfType("*dynamodb.GetItemInput")).Return(&dynamodb.GetItemOutput{
		Item: item,
	}, nil)

	stateRecord, err := storage.GetOAuthState("test-state")

	assert.NoError(t, err)
	assert.NotNil(t, stateRecord)
	mockDB.AssertExpectations(t)
}

func TestSessionStorage_DeleteOAuthState(t *testing.T) {
	mockDB := new(MockDynamoDBAPI)
	storage := NewSessionStorage(mockDB, "test-sessions-table")

	mockDB.On("DeleteItem", mock.AnythingOfType("*dynamodb.DeleteItemInput")).Return(&dynamodb.DeleteItemOutput{}, nil)

	err := storage.DeleteOAuthState("test-state")

	assert.NoError(t, err)
	mockDB.AssertExpectations(t)
}