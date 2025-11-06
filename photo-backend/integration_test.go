// Package main provides integration tests for the complete application flow.
// These tests verify that all services are properly wired together and that
// authentication flows work end-to-end.
package main

import (
	"context"
	"encoding/json"
	"os"
	"testing"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbiface"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/aws/aws-sdk-go/service/s3/s3iface"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"

	"photo-backend/internal/config"
	"photo-backend/internal/handler"
	"photo-backend/internal/middleware"
	"photo-backend/internal/processor"
	"photo-backend/internal/service"
	"photo-backend/internal/storage"
)

// TestApplicationWiring verifies that all services are properly initialized
// and that the main application can be constructed without errors.
func TestApplicationWiring(t *testing.T) {
	// Set up test environment variables
	setupTestEnvironment(t)
	
	// Load configuration
	cfg, err := config.LoadConfig()
	require.NoError(t, err, "Configuration should load successfully")
	
	// Create mock storage layers
	mockDynamoDB := &MockDynamoDBAPI{}
	mockS3 := &MockS3API{}
	
	albumStorage := storage.NewAlbumStorage(mockDynamoDB, cfg.AlbumsTable)
	photoStorage := storage.NewPhotoStorage(mockDynamoDB, cfg.DynamoTable)
	sessionStorage := storage.NewSessionStorage(mockDynamoDB, cfg.SessionsTable)
	s3Storage := storage.NewS3Storage(mockS3, cfg.S3Bucket)
	
	// Initialize processing layer
	imageProcessor := processor.NewImageProcessor()
	
	// Initialize business services
	albumService := service.NewAlbumService(albumStorage, photoStorage)
	authService := service.NewAuthService(cfg, sessionStorage)
	photoService, err := service.NewPhotoService(s3Storage, photoStorage, imageProcessor, albumService)
	require.NoError(t, err, "Photo service should initialize successfully")
	
	// Initialize middleware
	authMiddleware := middleware.NewAuthMiddleware(authService)
	
	// Initialize HTTP handler
	h, err := handler.NewHandler(photoService, authService, albumService, authMiddleware)
	require.NoError(t, err, "Handler should initialize successfully")
	
	// Verify handler is not nil
	assert.NotNil(t, h, "Handler should be initialized")
}

// TestProtectedEndpointsRequireAuthentication verifies that protected endpoints
// return 401 when accessed without authentication.
func TestProtectedEndpointsRequireAuthentication(t *testing.T) {
	setupTestEnvironment(t)
	
	h := createTestHandler(t)
	ctx := context.Background()
	
	protectedEndpoints := []struct {
		method string
		path   string
	}{
		{"POST", "/upload"},
		{"GET", "/photos"},
		{"DELETE", "/photos/test-id"},
		{"POST", "/albums"},
		{"GET", "/albums"},
		{"DELETE", "/albums/test-id"},
		{"GET", "/albums/test-id/photos"},
	}
	
	for _, endpoint := range protectedEndpoints {
		t.Run(endpoint.method+"_"+endpoint.path, func(t *testing.T) {
			request := events.APIGatewayProxyRequest{
				HTTPMethod: endpoint.method,
				Path:       endpoint.path,
				Headers:    map[string]string{},
			}
			
			response, err := h.HandleRequest(ctx, request)
			require.NoError(t, err, "Handler should not return system errors")
			
			assert.Equal(t, 401, response.StatusCode, "Protected endpoint should return 401 without authentication")
			
			var responseBody map[string]interface{}
			err = json.Unmarshal([]byte(response.Body), &responseBody)
			require.NoError(t, err, "Response should be valid JSON")
			
			assert.Contains(t, responseBody, "error", "Response should contain error message")
		})
	}
}

// TestAuthenticationEndpointsAccessible verifies that authentication endpoints
// are accessible without authentication.
func TestAuthenticationEndpointsAccessible(t *testing.T) {
	setupTestEnvironment(t)
	
	h := createTestHandler(t)
	ctx := context.Background()
	
	authEndpoints := []struct {
		method string
		path   string
	}{
		{"POST", "/auth/login"},
		{"GET", "/auth/status"},
		{"POST", "/auth/logout"},
	}
	
	for _, endpoint := range authEndpoints {
		t.Run(endpoint.method+"_"+endpoint.path, func(t *testing.T) {
			request := events.APIGatewayProxyRequest{
				HTTPMethod: endpoint.method,
				Path:       endpoint.path,
				Headers:    map[string]string{},
			}
			
			response, err := h.HandleRequest(ctx, request)
			require.NoError(t, err, "Handler should not return system errors")
			
			// Auth endpoints should not return 401 (they handle their own auth logic)
			assert.NotEqual(t, 401, response.StatusCode, "Auth endpoint should not return 401")
		})
	}
}

// TestCORSHandling verifies that CORS preflight requests are handled correctly.
func TestCORSHandling(t *testing.T) {
	setupTestEnvironment(t)
	
	h := createTestHandler(t)
	ctx := context.Background()
	
	request := events.APIGatewayProxyRequest{
		HTTPMethod: "OPTIONS",
		Path:       "/any-path",
		Headers:    map[string]string{},
	}
	
	response, err := h.HandleRequest(ctx, request)
	require.NoError(t, err, "CORS preflight should not return system errors")
	
	assert.Equal(t, 200, response.StatusCode, "CORS preflight should return 200")
	assert.Contains(t, response.Headers, "Access-Control-Allow-Origin", "CORS headers should be present")
	assert.Contains(t, response.Headers, "Access-Control-Allow-Methods", "CORS methods should be present")
}

// TestInvalidRoutes verifies that invalid routes return 404.
func TestInvalidRoutes(t *testing.T) {
	setupTestEnvironment(t)
	
	h := createTestHandler(t)
	ctx := context.Background()
	
	invalidRoutes := []struct {
		method string
		path   string
	}{
		{"GET", "/nonexistent"},
		{"POST", "/invalid/path"},
		{"PUT", "/not/found"},
	}
	
	for _, route := range invalidRoutes {
		t.Run(route.method+"_"+route.path, func(t *testing.T) {
			request := events.APIGatewayProxyRequest{
				HTTPMethod: route.method,
				Path:       route.path,
				Headers:    map[string]string{},
			}
			
			response, err := h.HandleRequest(ctx, request)
			require.NoError(t, err, "Handler should not return system errors")
			
			assert.Equal(t, 404, response.StatusCode, "Invalid route should return 404")
		})
	}
}

// Helper functions

// setupTestEnvironment sets up required environment variables for testing.
func setupTestEnvironment(t *testing.T) {
	envVars := map[string]string{
		"S3_BUCKET":             "test-bucket",
		"DYNAMODB_TABLE":        "test-photos-table",
		"SESSIONS_TABLE":        "test-sessions-table",
		"ALBUMS_TABLE":          "test-albums-table",
		"GOOGLE_CLIENT_ID":      "test-client-id",
		"GOOGLE_CLIENT_SECRET":  "test-client-secret",
		"GOOGLE_REDIRECT_URL":   "https://example.com/callback",
		"AUTHORIZED_EMAIL":      "lanctotsm@gmail.com",
		"AWS_REGION":            "us-east-1",
		"ENVIRONMENT":           "test",
	}
	
	for key, value := range envVars {
		err := os.Setenv(key, value)
		require.NoError(t, err, "Should be able to set environment variable %s", key)
	}
	
	// Clean up after test
	t.Cleanup(func() {
		for key := range envVars {
			os.Unsetenv(key)
		}
	})
}

// createTestHandler creates a fully configured handler for testing.
func createTestHandler(t *testing.T) *handler.Handler {
	cfg, err := config.LoadConfig()
	require.NoError(t, err, "Configuration should load successfully")
	
	// Create mock storage layers
	mockDynamoDB := &MockDynamoDBAPI{}
	mockS3 := &MockS3API{}
	
	albumStorage := storage.NewAlbumStorage(mockDynamoDB, cfg.AlbumsTable)
	photoStorage := storage.NewPhotoStorage(mockDynamoDB, cfg.DynamoTable)
	sessionStorage := storage.NewSessionStorage(mockDynamoDB, cfg.SessionsTable)
	s3Storage := storage.NewS3Storage(mockS3, cfg.S3Bucket)
	
	// Initialize processing layer
	imageProcessor := processor.NewImageProcessor()
	
	// Initialize business services
	albumService := service.NewAlbumService(albumStorage, photoStorage)
	authService := service.NewAuthService(cfg, sessionStorage)
	photoService, err := service.NewPhotoService(s3Storage, photoStorage, imageProcessor, albumService)
	require.NoError(t, err, "Photo service should initialize successfully")
	
	// Initialize middleware
	authMiddleware := middleware.NewAuthMiddleware(authService)
	
	// Initialize HTTP handler
	h, err := handler.NewHandler(photoService, authService, albumService, authMiddleware)
	require.NoError(t, err, "Handler should initialize successfully")
	
	return h
}

// Mock implementations for testing

// MockDynamoDBAPI is a mock implementation of DynamoDB API
type MockDynamoDBAPI struct {
	dynamodbiface.DynamoDBAPI
	mock.Mock
}

func (m *MockDynamoDBAPI) PutItem(input *dynamodb.PutItemInput) (*dynamodb.PutItemOutput, error) {
	// For integration tests, we just return success without validation
	return &dynamodb.PutItemOutput{}, nil
}

func (m *MockDynamoDBAPI) GetItem(input *dynamodb.GetItemInput) (*dynamodb.GetItemOutput, error) {
	// For integration tests, return empty result (not found)
	return &dynamodb.GetItemOutput{}, nil
}

func (m *MockDynamoDBAPI) Scan(input *dynamodb.ScanInput) (*dynamodb.ScanOutput, error) {
	// For integration tests, return empty result
	return &dynamodb.ScanOutput{}, nil
}

func (m *MockDynamoDBAPI) Query(input *dynamodb.QueryInput) (*dynamodb.QueryOutput, error) {
	// For integration tests, return empty result
	return &dynamodb.QueryOutput{}, nil
}

func (m *MockDynamoDBAPI) DeleteItem(input *dynamodb.DeleteItemInput) (*dynamodb.DeleteItemOutput, error) {
	// For integration tests, return success
	return &dynamodb.DeleteItemOutput{}, nil
}

func (m *MockDynamoDBAPI) UpdateItem(input *dynamodb.UpdateItemInput) (*dynamodb.UpdateItemOutput, error) {
	// For integration tests, return success
	return &dynamodb.UpdateItemOutput{}, nil
}

// MockS3API is a mock implementation of S3 API
type MockS3API struct {
	s3iface.S3API
	mock.Mock
}

func (m *MockS3API) PutObject(input *s3.PutObjectInput) (*s3.PutObjectOutput, error) {
	// For integration tests, return success
	return &s3.PutObjectOutput{}, nil
}

func (m *MockS3API) DeleteObject(input *s3.DeleteObjectInput) (*s3.DeleteObjectOutput, error) {
	// For integration tests, return success
	return &s3.DeleteObjectOutput{}, nil
}