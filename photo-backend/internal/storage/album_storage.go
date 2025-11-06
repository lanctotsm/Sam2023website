package storage

import (
	"fmt"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbiface"

	"photo-backend/internal/models/album"
)

// AlbumStorage handles album operations in DynamoDB
type AlbumStorage struct {
	client    dynamodbiface.DynamoDBAPI
	tableName string
}

// NewAlbumStorage creates a new AlbumStorage instance
func NewAlbumStorage(client dynamodbiface.DynamoDBAPI, tableName string) *AlbumStorage {
	return &AlbumStorage{
		client:    client,
		tableName: tableName,
	}
}

// SaveAlbum saves an album to DynamoDB
func (a *AlbumStorage) SaveAlbum(albumData *album.Album) error {
	item, err := dynamodbattribute.MarshalMap(albumData)
	if err != nil {
		return fmt.Errorf("failed to marshal album: %w", err)
	}

	_, err = a.client.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(a.tableName),
		Item:      item,
	})
	if err != nil {
		return fmt.Errorf("failed to save album: %w", err)
	}

	return nil
}

// GetAlbum retrieves an album by ID
func (a *AlbumStorage) GetAlbum(albumID string) (*album.Album, error) {
	result, err := a.client.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(a.tableName),
		Key: map[string]*dynamodb.AttributeValue{
			"album_id": {
				S: aws.String(albumID),
			},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get album: %w", err)
	}

	if result.Item == nil {
		return nil, fmt.Errorf("album not found")
	}

	var albumData album.Album
	if err := dynamodbattribute.UnmarshalMap(result.Item, &albumData); err != nil {
		return nil, fmt.Errorf("failed to unmarshal album: %w", err)
	}

	return &albumData, nil
}

// GetAlbumByUserAndID retrieves an album by ID and verifies user ownership
func (a *AlbumStorage) GetAlbumByUserAndID(albumID, userEmail string) (*album.Album, error) {
	albumData, err := a.GetAlbum(albumID)
	if err != nil {
		return nil, err
	}

	if albumData.UserEmail != userEmail {
		return nil, fmt.Errorf("album not found or access denied")
	}

	return albumData, nil
}

// ListAlbumsByUser retrieves all albums for a user
func (a *AlbumStorage) ListAlbumsByUser(userEmail string) ([]album.Album, error) {
	result, err := a.client.Query(&dynamodb.QueryInput{
		TableName:              aws.String(a.tableName),
		IndexName:              aws.String("user_email-created_at-index"),
		KeyConditionExpression: aws.String("user_email = :email"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":email": {
				S: aws.String(userEmail),
			},
		},
		ScanIndexForward: aws.Bool(false), // Sort by created_at descending
	})
	if err != nil {
		return nil, fmt.Errorf("failed to list albums: %w", err)
	}

	var albums []album.Album
	for _, item := range result.Items {
		var albumData album.Album
		if err := dynamodbattribute.UnmarshalMap(item, &albumData); err != nil {
			continue // Skip invalid albums
		}
		albums = append(albums, albumData)
	}

	return albums, nil
}

// ListAllAlbums retrieves all albums (for single-user system)
func (a *AlbumStorage) ListAllAlbums() ([]album.Album, error) {
	result, err := a.client.Scan(&dynamodb.ScanInput{
		TableName: aws.String(a.tableName),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to scan albums: %w", err)
	}

	var albums []album.Album
	for _, item := range result.Items {
		var albumData album.Album
		if err := dynamodbattribute.UnmarshalMap(item, &albumData); err != nil {
			continue // Skip invalid albums
		}
		albums = append(albums, albumData)
	}

	return albums, nil
}

// UpdateAlbum updates an existing album
func (a *AlbumStorage) UpdateAlbum(albumData *album.Album) error {
	// Update the updated_at timestamp
	albumData.UpdatedAt = time.Now().UTC()

	item, err := dynamodbattribute.MarshalMap(albumData)
	if err != nil {
		return fmt.Errorf("failed to marshal album: %w", err)
	}

	_, err = a.client.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(a.tableName),
		Item:      item,
	})
	if err != nil {
		return fmt.Errorf("failed to update album: %w", err)
	}

	return nil
}

// UpdateAlbumThumbnail updates the thumbnail for an album
func (a *AlbumStorage) UpdateAlbumThumbnail(albumID, thumbnailID string) error {
	_, err := a.client.UpdateItem(&dynamodb.UpdateItemInput{
		TableName: aws.String(a.tableName),
		Key: map[string]*dynamodb.AttributeValue{
			"album_id": {
				S: aws.String(albumID),
			},
		},
		UpdateExpression: aws.String("SET thumbnail_id = :tid, updated_at = :ua"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":tid": {
				S: aws.String(thumbnailID),
			},
			":ua": {
				S: aws.String(time.Now().UTC().Format(time.RFC3339)),
			},
		},
	})
	if err != nil {
		return fmt.Errorf("failed to update album thumbnail: %w", err)
	}

	return nil
}

// UpdateAlbumPhotoCount updates the photo count for an album
func (a *AlbumStorage) UpdateAlbumPhotoCount(albumID string, delta int) error {
	_, err := a.client.UpdateItem(&dynamodb.UpdateItemInput{
		TableName: aws.String(a.tableName),
		Key: map[string]*dynamodb.AttributeValue{
			"album_id": {
				S: aws.String(albumID),
			},
		},
		UpdateExpression: aws.String("ADD photo_count :delta SET updated_at = :ua"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":delta": {
				N: aws.String(fmt.Sprintf("%d", delta)),
			},
			":ua": {
				S: aws.String(time.Now().UTC().Format(time.RFC3339)),
			},
		},
	})
	if err != nil {
		return fmt.Errorf("failed to update album photo count: %w", err)
	}

	return nil
}

// DeleteAlbum deletes an album by ID
func (a *AlbumStorage) DeleteAlbum(albumID string) error {
	_, err := a.client.DeleteItem(&dynamodb.DeleteItemInput{
		TableName: aws.String(a.tableName),
		Key: map[string]*dynamodb.AttributeValue{
			"album_id": {
				S: aws.String(albumID),
			},
		},
	})
	if err != nil {
		return fmt.Errorf("failed to delete album: %w", err)
	}

	return nil
}

// DeleteAlbumByUserAndID deletes an album by ID after verifying user ownership
func (a *AlbumStorage) DeleteAlbumByUserAndID(albumID, userEmail string) error {
	// First verify ownership
	albumData, err := a.GetAlbumByUserAndID(albumID, userEmail)
	if err != nil {
		return err
	}

	// Check if album has photos
	if albumData.PhotoCount > 0 {
		return fmt.Errorf("cannot delete album with photos")
	}

	return a.DeleteAlbum(albumID)
}
