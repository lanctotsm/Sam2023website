package storage

import (
	"fmt"
	"log"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbiface"

	"photo-backend/internal/models/photo"
)

// PhotoStorage handles photo metadata operations in DynamoDB
type PhotoStorage struct {
	client    dynamodbiface.DynamoDBAPI
	tableName string
}

// NewPhotoStorage creates a new PhotoStorage instance
func NewPhotoStorage(client dynamodbiface.DynamoDBAPI, tableName string) *PhotoStorage {
	return &PhotoStorage{
		client:    client,
		tableName: tableName,
	}
}

// SavePhoto saves photo metadata to DynamoDB
func (p *PhotoStorage) SavePhoto(photoMeta *photo.PhotoMetadata) error {
	item, err := dynamodbattribute.MarshalMap(photoMeta)
	if err != nil {
		return fmt.Errorf("failed to marshal photo metadata: %w", err)
	}

	_, err = p.client.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(p.tableName),
		Item:      item,
	})
	if err != nil {
		return fmt.Errorf("failed to save photo metadata: %w", err)
	}

	return nil
}

// GetPhoto retrieves a photo by ID
func (p *PhotoStorage) GetPhoto(id string) (*photo.PhotoMetadata, error) {
	result, err := p.client.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(p.tableName),
		Key: map[string]*dynamodb.AttributeValue{
			"id": {
				S: aws.String(id),
			},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get photo: %w", err)
	}

	if result.Item == nil {
		return nil, fmt.Errorf("photo not found")
	}

	var photoMeta photo.PhotoMetadata
	if err := dynamodbattribute.UnmarshalMap(result.Item, &photoMeta); err != nil {
		return nil, fmt.Errorf("failed to unmarshal photo: %w", err)
	}

	return &photoMeta, nil
}

// ListPhotos retrieves all photos ordered by upload date (newest first)
func (p *PhotoStorage) ListPhotos() ([]photo.PhotoMetadata, error) {
	result, err := p.client.Scan(&dynamodb.ScanInput{
		TableName: aws.String(p.tableName),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to scan photos: %w", err)
	}

	var photos []photo.PhotoMetadata
	for _, item := range result.Items {
		var photoMeta photo.PhotoMetadata
		if err := dynamodbattribute.UnmarshalMap(item, &photoMeta); err != nil {
			log.Printf("Failed to unmarshal photo: %v", err)
			continue
		}
		photos = append(photos, photoMeta)
	}

	return photos, nil
}

// ListPhotosByAlbum retrieves photos for a specific album
func (p *PhotoStorage) ListPhotosByAlbum(albumID string) ([]photo.PhotoMetadata, error) {
	result, err := p.client.Query(&dynamodb.QueryInput{
		TableName:              aws.String(p.tableName),
		IndexName:              aws.String("album_id-uploaded_at-index"),
		KeyConditionExpression: aws.String("album_id = :albumId"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":albumId": {
				S: aws.String(albumID),
			},
		},
		ScanIndexForward: aws.Bool(false), // Sort by uploaded_at descending (newest first)
	})
	if err != nil {
		return nil, fmt.Errorf("failed to query photos by album: %w", err)
	}

	var photos []photo.PhotoMetadata
	for _, item := range result.Items {
		var photoMeta photo.PhotoMetadata
		if err := dynamodbattribute.UnmarshalMap(item, &photoMeta); err != nil {
			log.Printf("Failed to unmarshal photo: %v", err)
			continue
		}
		photos = append(photos, photoMeta)
	}

	return photos, nil
}

// ListPhotosByUser retrieves photos for a specific user
func (p *PhotoStorage) ListPhotosByUser(userEmail string) ([]photo.PhotoMetadata, error) {
	result, err := p.client.Query(&dynamodb.QueryInput{
		TableName:              aws.String(p.tableName),
		IndexName:              aws.String("user_email-uploaded_at-index"),
		KeyConditionExpression: aws.String("user_email = :userEmail"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":userEmail": {
				S: aws.String(userEmail),
			},
		},
		ScanIndexForward: aws.Bool(false), // Sort by uploaded_at descending (newest first)
	})
	if err != nil {
		return nil, fmt.Errorf("failed to query photos by user: %w", err)
	}

	var photos []photo.PhotoMetadata
	for _, item := range result.Items {
		var photoMeta photo.PhotoMetadata
		if err := dynamodbattribute.UnmarshalMap(item, &photoMeta); err != nil {
			log.Printf("Failed to unmarshal photo: %v", err)
			continue
		}
		photos = append(photos, photoMeta)
	}

	return photos, nil
}

// UpdatePhoto updates an existing photo's metadata
func (p *PhotoStorage) UpdatePhoto(photoMeta *photo.PhotoMetadata) error {
	item, err := dynamodbattribute.MarshalMap(photoMeta)
	if err != nil {
		return fmt.Errorf("failed to marshal photo metadata: %w", err)
	}

	_, err = p.client.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(p.tableName),
		Item:      item,
	})
	if err != nil {
		return fmt.Errorf("failed to update photo metadata: %w", err)
	}

	return nil
}

// DeletePhoto deletes a photo by ID
func (p *PhotoStorage) DeletePhoto(id string) error {
	_, err := p.client.DeleteItem(&dynamodb.DeleteItemInput{
		TableName: aws.String(p.tableName),
		Key: map[string]*dynamodb.AttributeValue{
			"id": {
				S: aws.String(id),
			},
		},
	})
	if err != nil {
		return fmt.Errorf("failed to delete photo: %w", err)
	}

	return nil
}
