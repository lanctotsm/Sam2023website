// Package main provides the entry point for the photo management Lambda function.
// It initializes all dependencies, configures services, and starts the Lambda runtime.
package main

import (
	"log"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/s3"

	"photo-backend/internal/config"
	"photo-backend/internal/handler"
	"photo-backend/internal/middleware"
	"photo-backend/internal/processor"
	"photo-backend/internal/service"
	"photo-backend/internal/storage"
)

func main() {
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Loading configuration: %v", err)
	}

	sess, err := session.NewSession()
	if err != nil {
		log.Fatalf("Creating AWS session: %v", err)
	}

	// Initialize AWS service clients
	s3Client := s3.New(sess)
	dynamoClient := dynamodb.New(sess)

	// Initialize storage layer
	s3Storage := storage.NewS3Storage(s3Client, cfg.S3Bucket)
	photoStorage := storage.NewPhotoStorage(dynamoClient, cfg.DynamoTable)
	albumStorage := storage.NewAlbumStorage(dynamoClient, cfg.AlbumsTable)
	sessionStorage := storage.NewSessionStorage(dynamoClient, cfg.SessionsTable)

	// Initialize processing layer
	imageProcessor := processor.NewImageProcessor()

	// Initialize business services
	albumService := service.NewAlbumService(albumStorage, photoStorage)
	authService := service.NewAuthService(cfg, sessionStorage)
	photoService, err := service.NewPhotoService(s3Storage, photoStorage, imageProcessor, albumService)
	if err != nil {
		log.Fatalf("Creating photo service: %v", err)
	}

	// Initialize middleware
	authMiddleware := middleware.NewAuthMiddleware(authService)

	// Initialize HTTP handler
	h, err := handler.NewHandler(photoService, authService, albumService, authMiddleware)
	if err != nil {
		log.Fatalf("Creating handler: %v", err)
	}

	// Start Lambda runtime
	lambda.Start(h.HandleRequest)
}