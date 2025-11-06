package storage

import (
	"context"
	"fmt"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbiface"

	"photo-backend/internal/models/auth"
)

// SessionStorage handles session operations in DynamoDB
type SessionStorage struct {
	*BaseStorage
}

// NewSessionStorage creates a new SessionStorage instance
func NewSessionStorage(client dynamodbiface.DynamoDBAPI, tableName string) *SessionStorage {
	return &SessionStorage{
		BaseStorage: NewBaseStorage(client, tableName),
	}
}

// SaveSession saves a session to DynamoDB with TTL
func (s *SessionStorage) SaveSession(session *auth.Session) error {
	return s.SaveSessionWithContext(context.Background(), session)
}

// SaveSessionWithContext saves a session to DynamoDB with context support
func (s *SessionStorage) SaveSessionWithContext(ctx context.Context, session *auth.Session) error {
	// Create item with TTL field as number for automatic cleanup
	item := map[string]*dynamodb.AttributeValue{
		"session_token": {S: aws.String(session.SessionToken)},
		"user_email":    {S: aws.String(session.UserEmail)},
		"created_at":    {S: aws.String(session.CreatedAt.Format(time.RFC3339))},
		"expires_at":    {N: aws.String(fmt.Sprintf("%d", session.ExpiresAt.Unix()))}, // TTL field
		"last_activity": {S: aws.String(session.LastActivity.Format(time.RFC3339))},
	}

	_, err := s.client.PutItemWithContext(ctx, &dynamodb.PutItemInput{
		TableName: aws.String(s.tableName),
		Item:      item,
	})
	if err != nil {
		return s.handleDynamoDBError("SaveSession", err)
	}

	return nil
}

// GetSession retrieves a session by token
func (s *SessionStorage) GetSession(sessionToken string) (*auth.Session, error) {
	key := map[string]*dynamodb.AttributeValue{
		"session_token": {S: aws.String(sessionToken)},
	}

	var session auth.Session
	if err := s.GetItem(key, &session); err != nil {
		return nil, err
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
	key := map[string]*dynamodb.AttributeValue{
		"session_token": {S: aws.String(sessionToken)},
	}

	return s.DeleteItem(key)
}

// ListSessionsByUser retrieves all sessions for a user
func (s *SessionStorage) ListSessionsByUser(userEmail string) ([]auth.Session, error) {
	input := &dynamodb.QueryInput{
		IndexName:              aws.String("user_email-created_at-index"),
		KeyConditionExpression: aws.String("user_email = :email"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":email": {S: aws.String(userEmail)},
		},
	}

	var sessions []auth.Session
	if err := s.QueryItems(input, &sessions); err != nil {
		return nil, err
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
