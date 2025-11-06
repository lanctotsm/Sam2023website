package storage

import (
	"fmt"
	"strconv"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbiface"

	"photo-backend/internal/models/auth"
)

// OAuthStateStorage handles OAuth state operations separately from sessions
type OAuthStateStorage struct {
	*BaseStorage
}

// NewOAuthStateStorage creates a new OAuthStateStorage instance
func NewOAuthStateStorage(client dynamodbiface.DynamoDBAPI, tableName string) *OAuthStateStorage {
	return &OAuthStateStorage{
		BaseStorage: NewBaseStorage(client, tableName),
	}
}

// SaveOAuthState stores an OAuth state with TTL
func (o *OAuthStateStorage) SaveOAuthState(state *auth.OAuthState) error {
	// Create item with TTL for automatic cleanup
	item := map[string]*dynamodb.AttributeValue{
		"state":      {S: aws.String(state.State)},
		"verifier":   {S: aws.String(state.Verifier)},
		"created_at": {S: aws.String(state.CreatedAt.Format(time.RFC3339))},
		"expires_at": {N: aws.String(fmt.Sprintf("%d", state.ExpiresAt.Unix()))}, // TTL field
	}

	_, err := o.client.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(o.tableName),
		Item:      item,
	})
	if err != nil {
		return fmt.Errorf("failed to save OAuth state: %w", err)
	}

	return nil
}

// GetOAuthState retrieves and validates an OAuth state
func (o *OAuthStateStorage) GetOAuthState(state string) (*auth.OAuthState, error) {
	key := map[string]*dynamodb.AttributeValue{
		"state": {S: aws.String(state)},
	}

	result, err := o.client.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(o.tableName),
		Key:       key,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get OAuth state: %w", err)
	}

	if result.Item == nil {
		return nil, nil // State not found
	}

	// Check expiration before unmarshaling
	if expiresAtStr, exists := result.Item["expires_at"]; exists && expiresAtStr.N != nil {
		expiresAt, err := strconv.ParseInt(*expiresAtStr.N, 10, 64)
		if err == nil && time.Now().Unix() > expiresAt {
			// State expired, clean it up
			o.DeleteOAuthState(state)
			return nil, nil
		}
	}

	// Manual unmarshaling for time handling
	stateRecord := &auth.OAuthState{State: state}
	
	if verifier, exists := result.Item["verifier"]; exists && verifier.S != nil {
		stateRecord.Verifier = *verifier.S
	}
	
	if createdAt, exists := result.Item["created_at"]; exists && createdAt.S != nil {
		if parsed, err := time.Parse(time.RFC3339, *createdAt.S); err == nil {
			stateRecord.CreatedAt = parsed
		}
	}
	
	if expiresAt, exists := result.Item["expires_at"]; exists && expiresAt.N != nil {
		if unix, err := strconv.ParseInt(*expiresAt.N, 10, 64); err == nil {
			stateRecord.ExpiresAt = time.Unix(unix, 0).UTC()
		}
	}

	return stateRecord, nil
}

// DeleteOAuthState removes an OAuth state
func (o *OAuthStateStorage) DeleteOAuthState(state string) error {
	key := map[string]*dynamodb.AttributeValue{
		"state": {S: aws.String(state)},
	}

	return o.DeleteItem(key)
}