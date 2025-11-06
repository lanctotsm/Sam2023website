package storage

import (
	"fmt"
	"strconv"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbiface"

	"photo-backend/internal/models/auth"
)

// SessionStorage handles session operations in DynamoDB
type SessionStorage struct {
	client    dynamodbiface.DynamoDBAPI
	tableName string
}

// NewSessionStorage creates a new SessionStorage instance
func NewSessionStorage(client dynamodbiface.DynamoDBAPI, tableName string) *SessionStorage {
	return &SessionStorage{
		client:    client,
		tableName: tableName,
	}
}

// SaveSession saves a session to DynamoDB
func (s *SessionStorage) SaveSession(session *auth.Session) error {
	// Manually create the item to ensure proper TTL field format
	item := map[string]*dynamodb.AttributeValue{
		"session_token": {S: aws.String(session.SessionToken)},
		"user_email":    {S: aws.String(session.UserEmail)},
		"created_at":    {S: aws.String(session.CreatedAt.Format(time.RFC3339))},
		"expires_at":    {N: aws.String(fmt.Sprintf("%d", session.ExpiresAt.Unix()))}, // TTL field as number
		"last_activity": {S: aws.String(session.LastActivity.Format(time.RFC3339))},
	}

	_, err := s.client.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(s.tableName),
		Item:      item,
	})
	if err != nil {
		return fmt.Errorf("failed to save session: %w", err)
	}

	return nil
}

// GetSession retrieves a session by token
func (s *SessionStorage) GetSession(sessionToken string) (*auth.Session, error) {
	result, err := s.client.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(s.tableName),
		Key: map[string]*dynamodb.AttributeValue{
			"session_token": {
				S: aws.String(sessionToken),
			},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get session: %w", err)
	}

	if result.Item == nil {
		return nil, fmt.Errorf("session not found")
	}

	var session auth.Session
	if err := dynamodbattribute.UnmarshalMap(result.Item, &session); err != nil {
		return nil, fmt.Errorf("failed to unmarshal session: %w", err)
	}

	return &session, nil
}

// UpdateSession updates an existing session
func (s *SessionStorage) UpdateSession(session *auth.Session) error {
	// Update both last_activity and expires_at fields
	_, err := s.client.UpdateItem(&dynamodb.UpdateItemInput{
		TableName: aws.String(s.tableName),
		Key: map[string]*dynamodb.AttributeValue{
			"session_token": {
				S: aws.String(session.SessionToken),
			},
		},
		UpdateExpression: aws.String("SET last_activity = :la, expires_at = :ea"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":la": {
				S: aws.String(session.LastActivity.Format(time.RFC3339)),
			},
			":ea": {
				N: aws.String(fmt.Sprintf("%d", session.ExpiresAt.Unix())),
			},
		},
	})
	if err != nil {
		return fmt.Errorf("failed to update session: %w", err)
	}

	return nil
}

// DeleteSession deletes a session by token
func (s *SessionStorage) DeleteSession(sessionToken string) error {
	_, err := s.client.DeleteItem(&dynamodb.DeleteItemInput{
		TableName: aws.String(s.tableName),
		Key: map[string]*dynamodb.AttributeValue{
			"session_token": {
				S: aws.String(sessionToken),
			},
		},
	})
	if err != nil {
		return fmt.Errorf("failed to delete session: %w", err)
	}

	return nil
}

// ListSessionsByUser retrieves all sessions for a user
func (s *SessionStorage) ListSessionsByUser(userEmail string) ([]auth.Session, error) {
	result, err := s.client.Query(&dynamodb.QueryInput{
		TableName:              aws.String(s.tableName),
		IndexName:              aws.String("user_email-created_at-index"),
		KeyConditionExpression: aws.String("user_email = :email"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":email": {
				S: aws.String(userEmail),
			},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to list sessions: %w", err)
	}

	var sessions []auth.Session
	for _, item := range result.Items {
		var session auth.Session
		if err := dynamodbattribute.UnmarshalMap(item, &session); err != nil {
			continue // Skip invalid sessions
		}
		sessions = append(sessions, session)
	}

	return sessions, nil
}

// CleanupExpiredSessions removes expired sessions
func (s *SessionStorage) CleanupExpiredSessions() error {
	// Note: In production, this would typically be handled by DynamoDB TTL
	// This method is for manual cleanup if needed
	
	now := time.Now().UTC()
	
	// Scan for expired sessions
	result, err := s.client.Scan(&dynamodb.ScanInput{
		TableName:        aws.String(s.tableName),
		FilterExpression: aws.String("expires_at < :now"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":now": {
				S: aws.String(now.Format(time.RFC3339)),
			},
		},
	})
	if err != nil {
		return fmt.Errorf("failed to scan for expired sessions: %w", err)
	}

	// Delete expired sessions
	for _, item := range result.Items {
		sessionToken := item["session_token"].S
		if sessionToken != nil {
			if err := s.DeleteSession(*sessionToken); err != nil {
				// Log error but continue cleanup
				fmt.Printf("Warning: failed to delete expired session %s: %v\n", *sessionToken, err)
			}
		}
	}

	return nil
}

// OAuth State Management Methods

// SaveOAuthState stores an OAuth state parameter and PKCE verifier temporarily in DynamoDB.
// Uses the same table as sessions but with a different key prefix to separate concerns.
// The state automatically expires via DynamoDB TTL after 5 minutes.
func (s *SessionStorage) SaveOAuthState(state *auth.OAuthState) error {
	// Use a prefixed key to distinguish from session tokens
	stateKey := "oauth_state_" + state.State
	
	// Create DynamoDB item with TTL and verifier
	item := map[string]*dynamodb.AttributeValue{
		"session_token": {S: aws.String(stateKey)},
		"user_email":    {S: aws.String("oauth_state")}, // Placeholder for GSI compatibility
		"verifier":      {S: aws.String(state.Verifier)}, // Store PKCE verifier
		"created_at":    {S: aws.String(state.CreatedAt.Format(time.RFC3339))},
		"expires_at":    {N: aws.String(fmt.Sprintf("%d", state.ExpiresAt.Unix()))}, // TTL field
	}
	
	_, err := s.client.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(s.tableName),
		Item:      item,
	})
	if err != nil {
		return fmt.Errorf("failed to save OAuth state: %w", err)
	}
	
	return nil
}

// GetOAuthState retrieves an OAuth state parameter and its associated PKCE verifier.
// Returns the state record if it exists and hasn't expired, nil otherwise.
func (s *SessionStorage) GetOAuthState(state string) (*auth.OAuthState, error) {
	stateKey := "oauth_state_" + state
	
	result, err := s.client.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(s.tableName),
		Key: map[string]*dynamodb.AttributeValue{
			"session_token": {S: aws.String(stateKey)},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get OAuth state: %w", err)
	}
	
	// State doesn't exist
	if result.Item == nil {
		return nil, nil
	}
	
	// Check if state has expired (additional check beyond DynamoDB TTL)
	if expiresAtStr, exists := result.Item["expires_at"]; exists && expiresAtStr.N != nil {
		expiresAt, err := strconv.ParseInt(*expiresAtStr.N, 10, 64)
		if err == nil && time.Now().Unix() > expiresAt {
			// State has expired, clean it up
			s.DeleteOAuthState(state)
			return nil, nil
		}
	}
	
	// Manually unmarshal the state record to handle time conversion
	stateRecord := &auth.OAuthState{
		State: state,
	}
	
	// Extract verifier
	if verifierAttr, exists := result.Item["verifier"]; exists && verifierAttr.S != nil {
		stateRecord.Verifier = *verifierAttr.S
	}
	
	// Extract created_at
	if createdAtAttr, exists := result.Item["created_at"]; exists && createdAtAttr.S != nil {
		if createdAt, err := time.Parse(time.RFC3339, *createdAtAttr.S); err == nil {
			stateRecord.CreatedAt = createdAt
		}
	}
	
	// Extract expires_at (stored as Unix timestamp for TTL)
	if expiresAtAttr, exists := result.Item["expires_at"]; exists && expiresAtAttr.N != nil {
		if expiresAtUnix, err := strconv.ParseInt(*expiresAtAttr.N, 10, 64); err == nil {
			stateRecord.ExpiresAt = time.Unix(expiresAtUnix, 0).UTC()
		}
	}
	
	return stateRecord, nil
}

// DeleteOAuthState removes an OAuth state parameter from storage.
// This is called after successful validation to prevent replay attacks.
func (s *SessionStorage) DeleteOAuthState(state string) error {
	stateKey := "oauth_state_" + state
	
	_, err := s.client.DeleteItem(&dynamodb.DeleteItemInput{
		TableName: aws.String(s.tableName),
		Key: map[string]*dynamodb.AttributeValue{
			"session_token": {S: aws.String(stateKey)},
		},
	})
	if err != nil {
		return fmt.Errorf("failed to delete OAuth state: %w", err)
	}
	
	return nil
}