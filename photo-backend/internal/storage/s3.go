package storage

import (
	"bytes"
	"fmt"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/aws/aws-sdk-go/service/s3/s3iface"
)

// S3Storage handles S3 operations
type S3Storage struct {
	client     s3iface.S3API
	bucketName string
}

// NewS3Storage creates a new S3Storage instance
func NewS3Storage(client s3iface.S3API, bucketName string) *S3Storage {
	return &S3Storage{
		client:     client,
		bucketName: bucketName,
	}
}

// UploadFile uploads a file to S3
func (s *S3Storage) UploadFile(key string, data []byte, contentType string) error {
	_, err := s.client.PutObject(&s3.PutObjectInput{
		Bucket:      aws.String(s.bucketName),
		Key:         aws.String(key),
		Body:        bytes.NewReader(data),
		ContentType: aws.String(contentType),
		ACL:         aws.String("public-read"),
	})
	if err != nil {
		return fmt.Errorf("failed to upload file to S3: %w", err)
	}
	return nil
}

// DeleteFile deletes a file from S3
func (s *S3Storage) DeleteFile(key string) error {
	_, err := s.client.DeleteObject(&s3.DeleteObjectInput{
		Bucket: aws.String(s.bucketName),
		Key:    aws.String(key),
	})
	if err != nil {
		return fmt.Errorf("failed to delete file from S3: %w", err)
	}
	return nil
}

// GetFileURL returns the public URL for a file
func (s *S3Storage) GetFileURL(key string) string {
	return fmt.Sprintf("https://%s.s3.amazonaws.com/%s", s.bucketName, key)
}