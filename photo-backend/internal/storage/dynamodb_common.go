package storage

import (
	"context"
	"fmt"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/awserr"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbiface"
)

// BaseStorage provides common DynamoDB operations to reduce code duplication
type BaseStorage struct {
	client    dynamodbiface.DynamoDBAPI
	tableName string
}

// NewBaseStorage creates a new BaseStorage instance
func NewBaseStorage(client dynamodbiface.DynamoDBAPI, tableName string) *BaseStorage {
	return &BaseStorage{
		client:    client,
		tableName: tableName,
	}
}

// PutItem saves an item to DynamoDB using consistent marshaling
func (b *BaseStorage) PutItem(item interface{}) error {
	return b.PutItemWithContext(context.Background(), item)
}

// PutItemWithContext saves an item to DynamoDB with context support
func (b *BaseStorage) PutItemWithContext(ctx context.Context, item interface{}) error {
	marshaledItem, err := dynamodbattribute.MarshalMap(item)
	if err != nil {
		return fmt.Errorf("failed to marshal item: %w", err)
	}

	_, err = b.client.PutItemWithContext(ctx, &dynamodb.PutItemInput{
		TableName: aws.String(b.tableName),
		Item:      marshaledItem,
	})
	if err != nil {
		return b.handleDynamoDBError("PutItem", err)
	}

	return nil
}

// GetItem retrieves an item by key and unmarshals it
func (b *BaseStorage) GetItem(key map[string]*dynamodb.AttributeValue, result interface{}) error {
	return b.GetItemWithContext(context.Background(), key, result)
}

// GetItemWithContext retrieves an item by key with context support
func (b *BaseStorage) GetItemWithContext(ctx context.Context, key map[string]*dynamodb.AttributeValue, result interface{}) error {
	output, err := b.client.GetItemWithContext(ctx, &dynamodb.GetItemInput{
		TableName:      aws.String(b.tableName),
		Key:            key,
		ConsistentRead: aws.Bool(true), // Use consistent reads for critical data
	})
	if err != nil {
		return b.handleDynamoDBError("GetItem", err)
	}

	if output.Item == nil {
		return ErrItemNotFound
	}

	if err := dynamodbattribute.UnmarshalMap(output.Item, result); err != nil {
		return fmt.Errorf("failed to unmarshal item: %w", err)
	}

	return nil
}

// DeleteItem deletes an item by key
func (b *BaseStorage) DeleteItem(key map[string]*dynamodb.AttributeValue) error {
	return b.DeleteItemWithContext(context.Background(), key)
}

// DeleteItemWithContext deletes an item by key with context support
func (b *BaseStorage) DeleteItemWithContext(ctx context.Context, key map[string]*dynamodb.AttributeValue) error {
	_, err := b.client.DeleteItemWithContext(ctx, &dynamodb.DeleteItemInput{
		TableName: aws.String(b.tableName),
		Key:       key,
	})
	if err != nil {
		return b.handleDynamoDBError("DeleteItem", err)
	}

	return nil
}

// QueryItems performs a query and unmarshals results
func (b *BaseStorage) QueryItems(input *dynamodb.QueryInput, results interface{}) error {
	return b.QueryItemsWithContext(context.Background(), input, results)
}

// QueryItemsWithContext performs a query with context support
func (b *BaseStorage) QueryItemsWithContext(ctx context.Context, input *dynamodb.QueryInput, results interface{}) error {
	input.TableName = aws.String(b.tableName)

	// Set reasonable limits for Lambda to prevent timeouts
	if input.Limit == nil {
		input.Limit = aws.Int64(100)
	}

	output, err := b.client.QueryWithContext(ctx, input)
	if err != nil {
		return b.handleDynamoDBError("Query", err)
	}

	if err := dynamodbattribute.UnmarshalListOfMaps(output.Items, results); err != nil {
		return fmt.Errorf("failed to unmarshal query results: %w", err)
	}

	return nil
}

// ScanItems performs a scan and unmarshals results
func (b *BaseStorage) ScanItems(input *dynamodb.ScanInput, results interface{}) error {
	input.TableName = aws.String(b.tableName)

	output, err := b.client.Scan(input)
	if err != nil {
		return fmt.Errorf("failed to scan items: %w", err)
	}

	if err := dynamodbattribute.UnmarshalListOfMaps(output.Items, results); err != nil {
		return fmt.Errorf("failed to unmarshal scan results: %w", err)
	}

	return nil
}

// UpdateItemWithTimestamp updates an item and sets updated_at timestamp
func (b *BaseStorage) UpdateItemWithTimestamp(key map[string]*dynamodb.AttributeValue, updateExpression string, expressionValues map[string]*dynamodb.AttributeValue) error {
	// Add updated_at timestamp to the update
	if expressionValues == nil {
		expressionValues = make(map[string]*dynamodb.AttributeValue)
	}
	expressionValues[":updated_at"] = &dynamodb.AttributeValue{
		S: aws.String(time.Now().UTC().Format(time.RFC3339)),
	}

	// Append updated_at to the update expression if not already present
	if updateExpression != "" && !contains(updateExpression, "updated_at") {
		updateExpression += ", updated_at = :updated_at"
	}

	_, err := b.client.UpdateItem(&dynamodb.UpdateItemInput{
		TableName:                 aws.String(b.tableName),
		Key:                       key,
		UpdateExpression:          aws.String(updateExpression),
		ExpressionAttributeValues: expressionValues,
	})
	if err != nil {
		return fmt.Errorf("failed to update item: %w", err)
	}

	return nil
}

// contains checks if a string contains a substring
func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr ||
		(len(s) > len(substr) &&
			(s[:len(substr)] == substr ||
				s[len(s)-len(substr):] == substr ||
				containsSubstring(s, substr))))
}

func containsSubstring(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

// handleDynamoDBError provides consistent error handling for DynamoDB operations
func (b *BaseStorage) handleDynamoDBError(operation string, err error) error {
	if awsErr, ok := err.(awserr.Error); ok {
		switch awsErr.Code() {
		case dynamodb.ErrCodeResourceNotFoundException:
			return fmt.Errorf("table %s not found during %s: %w", b.tableName, operation, err)
		case dynamodb.ErrCodeProvisionedThroughputExceededException:
			return fmt.Errorf("throughput exceeded for %s on table %s: %w", operation, b.tableName, err)
		case dynamodb.ErrCodeItemCollectionSizeLimitExceededException:
			return fmt.Errorf("item collection size limit exceeded during %s: %w", operation, err)
		case dynamodb.ErrCodeConditionalCheckFailedException:
			return fmt.Errorf("conditional check failed during %s: %w", operation, err)
		case "ValidationException":
			return fmt.Errorf("validation error during %s: %w", operation, err)
		default:
			return fmt.Errorf("DynamoDB %s operation failed: %w", operation, err)
		}
	}
	return fmt.Errorf("DynamoDB %s operation failed: %w", operation, err)
}

// Custom errors for better error handling
var (
	ErrItemNotFound = fmt.Errorf("item not found")
)
