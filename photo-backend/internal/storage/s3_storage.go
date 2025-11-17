package storage

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"strings"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/awserr"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/aws/aws-sdk-go/service/s3/s3iface"
)

// S3Storage handles S3 operations for photo storage
type S3Storage struct {
	client           s3iface.S3API
	bucket           string
	cloudFrontDomain string
}

// NewS3Storage creates a new S3Storage instance
func NewS3Storage(client s3iface.S3API, bucket string) *S3Storage {
	return &S3Storage{
		client:           client,
		bucket:           bucket,
		cloudFrontDomain: "",
	}
}

// NewS3StorageWithCloudFront creates a new S3Storage instance with CloudFront support
func NewS3StorageWithCloudFront(client s3iface.S3API, bucket string, cloudFrontDomain string) *S3Storage {
	return &S3Storage{
		client:           client,
		bucket:           bucket,
		cloudFrontDomain: cloudFrontDomain,
	}
}

// UploadFile uploads a file to S3
func (s *S3Storage) UploadFile(key string, data []byte, contentType string) error {
	return s.UploadFileWithContext(context.Background(), key, data, contentType)
}

// UploadFileWithContext uploads a file to S3 with context support
func (s *S3Storage) UploadFileWithContext(ctx context.Context, key string, data []byte, contentType string) error {
	_, err := s.client.PutObjectWithContext(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(s.bucket),
		Key:         aws.String(key),
		Body:        bytes.NewReader(data),
		ContentType: aws.String(contentType),
		// Add server-side encryption for security
		ServerSideEncryption: aws.String("AES256"),
	})
	if err != nil {
		return s.handleS3Error("UploadFile", err)
	}

	return nil
}

// DownloadFile downloads a file from S3
func (s *S3Storage) DownloadFile(key string) ([]byte, error) {
	result, err := s.client.GetObject(&s3.GetObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to download file from S3: %w", err)
	}
	defer result.Body.Close()

	data, err := io.ReadAll(result.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read file data: %w", err)
	}

	return data, nil
}

// DeleteFile deletes a file from S3
func (s *S3Storage) DeleteFile(key string) error {
	return s.DeleteFileWithContext(context.Background(), key)
}

// DeleteFileWithContext deletes a file from S3 with context support
func (s *S3Storage) DeleteFileWithContext(ctx context.Context, key string) error {
	_, err := s.client.DeleteObjectWithContext(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return s.handleS3Error("DeleteFile", err)
	}

	return nil
}

// DeleteFiles deletes multiple files from S3
func (s *S3Storage) DeleteFiles(keys []string) error {
	if len(keys) == 0 {
		return nil
	}

	// Convert keys to delete objects
	objects := make([]*s3.ObjectIdentifier, len(keys))
	for i, key := range keys {
		objects[i] = &s3.ObjectIdentifier{
			Key: aws.String(key),
		}
	}

	_, err := s.client.DeleteObjects(&s3.DeleteObjectsInput{
		Bucket: aws.String(s.bucket),
		Delete: &s3.Delete{
			Objects: objects,
		},
	})
	if err != nil {
		return fmt.Errorf("failed to delete files from S3: %w", err)
	}

	return nil
}

// GetPresignedURL generates a presigned URL for downloading a file
func (s *S3Storage) GetPresignedURL(key string) (string, error) {
	req, _ := s.client.GetObjectRequest(&s3.GetObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	})

	url, err := req.Presign(3600) // 1 hour expiration
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned URL: %w", err)
	}

	return url, nil
}

// FileExists checks if a file exists in S3
func (s *S3Storage) FileExists(key string) (bool, error) {
	_, err := s.client.HeadObject(&s3.HeadObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		if strings.Contains(err.Error(), "NotFound") {
			return false, nil
		}
		return false, fmt.Errorf("failed to check file existence: %w", err)
	}

	return true, nil
}

// GetFileSize returns the size of a file in S3
func (s *S3Storage) GetFileSize(key string) (int64, error) {
	result, err := s.client.HeadObject(&s3.HeadObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return 0, fmt.Errorf("failed to get file size: %w", err)
	}

	return *result.ContentLength, nil
}

// GetFileURL returns the public URL for a file
// If CloudFront is configured, returns CloudFront URL, otherwise returns direct S3 URL
func (s *S3Storage) GetFileURL(key string) string {
	if s.cloudFrontDomain != "" {
		return fmt.Sprintf("https://%s/%s", s.cloudFrontDomain, key)
	}
	return fmt.Sprintf("https://%s.s3.amazonaws.com/%s", s.bucket, key)
}

// handleS3Error provides consistent error handling for S3 operations
func (s *S3Storage) handleS3Error(operation string, err error) error {
	if awsErr, ok := err.(awserr.Error); ok {
		switch awsErr.Code() {
		case s3.ErrCodeNoSuchBucket:
			return fmt.Errorf("bucket %s not found during %s: %w", s.bucket, operation, err)
		case s3.ErrCodeNoSuchKey:
			return fmt.Errorf("key not found during %s: %w", operation, err)
		case "AccessDenied":
			return fmt.Errorf("access denied during %s: %w", operation, err)
		case "InvalidBucketName":
			return fmt.Errorf("invalid bucket name %s during %s: %w", s.bucket, operation, err)
		default:
			return fmt.Errorf("S3 %s operation failed: %w", operation, err)
		}
	}
	return fmt.Errorf("S3 %s operation failed: %w", operation, err)
}
