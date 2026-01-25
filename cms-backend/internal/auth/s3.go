package auth

import (
	"context"
	"net/url"
	"time"

	"cms-backend/internal/config"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/feature/s3/manager"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type S3PresignClient struct {
	Client  *s3.Client
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

	// Allow S3-compatible endpoints for local dev (e.g. MinIO).
	// NOTE: Presigned URLs are used by the browser, so you can optionally provide a
	// separate presign endpoint to control the host (e.g. localhost vs docker DNS).
	clientCfg := awsCfg
	if cfg.S3EndpointURL != "" {
		clientCfg.EndpointResolverWithOptions = s3EndpointResolver(cfg.S3EndpointURL)
	}

	presignCfg := awsCfg
	if cfg.S3PresignEndpointURL != "" {
		presignCfg.EndpointResolverWithOptions = s3EndpointResolver(cfg.S3PresignEndpointURL)
	} else if cfg.S3EndpointURL != "" {
		presignCfg.EndpointResolverWithOptions = s3EndpointResolver(cfg.S3EndpointURL)
	}

	client := s3.NewFromConfig(clientCfg, func(o *s3.Options) {
		o.UsePathStyle = cfg.S3ForcePathStyle
	})
	presignClient := s3.NewFromConfig(presignCfg, func(o *s3.Options) {
		o.UsePathStyle = cfg.S3ForcePathStyle
	})
	return &S3PresignClient{
		Client: client,
		Presign: s3.NewPresignClient(presignClient, func(o *s3.PresignOptions) {
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

func s3EndpointResolver(endpoint string) aws.EndpointResolverWithOptionsFunc {
	return func(service, region string, _ ...any) (aws.Endpoint, error) {
		if service != s3.ServiceID {
			return aws.Endpoint{}, &aws.EndpointNotFoundError{}
		}
		parsed, err := url.Parse(endpoint)
		if err != nil {
			return aws.Endpoint{}, err
		}
		return aws.Endpoint{
			URL:               parsed.String(),
			SigningRegion:     region,
			HostnameImmutable: true,
		}, nil
	}
}
