package auth

import (
	"context"
	"time"

	"cms-backend/internal/config"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/feature/s3/manager"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type S3PresignClient struct {
	Presign *s3.PresignClient
	Bucket  string
	Region  string
}

func NewS3PresignClient(ctx context.Context, cfg config.Config) (*S3PresignClient, error) {
	options := []func(*awsconfig.LoadOptions) error{
		awsconfig.WithRegion(cfg.S3Region),
	}

	if cfg.AWSUseStaticCreds && cfg.AWSAccessKeyID != "" && cfg.AWSSecretAccessKey != "" {
		options = append(options, awsconfig.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
			cfg.AWSAccessKeyID,
			cfg.AWSSecretAccessKey,
			"",
		)))
	}

	awsCfg, err := awsconfig.LoadDefaultConfig(ctx, options...)
	if err != nil {
		return nil, err
	}

	client := s3.NewFromConfig(awsCfg)
	return &S3PresignClient{
		Presign: s3.NewPresignClient(client, func(o *s3.PresignOptions) {
			o.Expires = 10 * time.Minute
		}),
		Bucket: cfg.S3Bucket,
		Region: cfg.S3Region,
	}, nil
}

func (c *S3PresignClient) PresignPut(ctx context.Context, key, contentType string, size int64) (string, error) {
	input := &s3.PutObjectInput{
		Bucket:      aws.String(c.Bucket),
		Key:         aws.String(key),
		ContentType: aws.String(contentType),
	}

	if size > 0 {
		input.ContentLength = aws.Int64(size)
	}

	res, err := c.Presign.PresignPutObject(ctx, input)
	if err != nil {
		return "", err
	}
	return res.URL, nil
}

func (c *S3PresignClient) UploadManager(awsCfg aws.Config) *manager.Uploader {
	return manager.NewUploader(s3.NewFromConfig(awsCfg))
}
