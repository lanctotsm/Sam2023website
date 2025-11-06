package config

import (
	"os"
	"testing"
)

func TestLoadConfig(t *testing.T) {
	// Save original env vars
	originalS3 := os.Getenv("S3_BUCKET")
	originalDynamo := os.Getenv("DYNAMODB_TABLE")
	originalSessions := os.Getenv("SESSIONS_TABLE")
	originalAlbums := os.Getenv("ALBUMS_TABLE")
	originalOAuthStates := os.Getenv("OAUTH_STATES_TABLE")
	originalGoogleClientID := os.Getenv("GOOGLE_CLIENT_ID")
	originalGoogleClientSecret := os.Getenv("GOOGLE_CLIENT_SECRET")
	originalGoogleRedirectURL := os.Getenv("GOOGLE_REDIRECT_URL")

	// Clean up after test
	defer func() {
		os.Setenv("S3_BUCKET", originalS3)
		os.Setenv("DYNAMODB_TABLE", originalDynamo)
		os.Setenv("SESSIONS_TABLE", originalSessions)
		os.Setenv("ALBUMS_TABLE", originalAlbums)
		os.Setenv("OAUTH_STATES_TABLE", originalOAuthStates)
		os.Setenv("GOOGLE_CLIENT_ID", originalGoogleClientID)
		os.Setenv("GOOGLE_CLIENT_SECRET", originalGoogleClientSecret)
		os.Setenv("GOOGLE_REDIRECT_URL", originalGoogleRedirectURL)
	}()

	// Test valid configuration
	os.Setenv("S3_BUCKET", "test-bucket")
	os.Setenv("DYNAMODB_TABLE", "test-table")
	os.Setenv("SESSIONS_TABLE", "test-sessions")
	os.Setenv("ALBUMS_TABLE", "test-albums")
	os.Setenv("OAUTH_STATES_TABLE", "test-oauth-states")
	os.Setenv("GOOGLE_CLIENT_ID", "test-client-id")
	os.Setenv("GOOGLE_CLIENT_SECRET", "test-client-secret")
	os.Setenv("GOOGLE_REDIRECT_URL", "http://localhost/callback")

	config, err := LoadConfig()
	if err != nil {
		t.Fatalf("LoadConfig failed: %v", err)
	}

	if config.S3Bucket != "test-bucket" {
		t.Errorf("Expected S3Bucket 'test-bucket', got '%s'", config.S3Bucket)
	}

	if config.DynamoTable != "test-table" {
		t.Errorf("Expected DynamoTable 'test-table', got '%s'", config.DynamoTable)
	}

	if config.SessionsTable != "test-sessions" {
		t.Errorf("Expected SessionsTable 'test-sessions', got '%s'", config.SessionsTable)
	}

	if config.AlbumsTable != "test-albums" {
		t.Errorf("Expected AlbumsTable 'test-albums', got '%s'", config.AlbumsTable)
	}

	if config.GoogleClientID != "test-client-id" {
		t.Errorf("Expected GoogleClientID 'test-client-id', got '%s'", config.GoogleClientID)
	}

	// Test missing required environment variables
	testCases := []struct {
		name   string
		unset  string
		expect string
	}{
		{"S3_BUCKET", "S3_BUCKET", "S3_BUCKET environment variable is required"},
		{"DYNAMODB_TABLE", "DYNAMODB_TABLE", "DYNAMODB_TABLE environment variable is required"},
		{"SESSIONS_TABLE", "SESSIONS_TABLE", "SESSIONS_TABLE environment variable is required"},
		{"ALBUMS_TABLE", "ALBUMS_TABLE", "ALBUMS_TABLE environment variable is required"},
		{"GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_ID environment variable is required"},
		{"GOOGLE_CLIENT_SECRET", "GOOGLE_CLIENT_SECRET", "GOOGLE_CLIENT_SECRET environment variable is required"},
		{"GOOGLE_REDIRECT_URL", "GOOGLE_REDIRECT_URL", "GOOGLE_REDIRECT_URL environment variable is required"},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			// Set all required vars first
			os.Setenv("S3_BUCKET", "test-bucket")
			os.Setenv("DYNAMODB_TABLE", "test-table")
			os.Setenv("SESSIONS_TABLE", "test-sessions")
			os.Setenv("ALBUMS_TABLE", "test-albums")
			os.Setenv("GOOGLE_CLIENT_ID", "test-client-id")
			os.Setenv("GOOGLE_CLIENT_SECRET", "test-client-secret")
			os.Setenv("GOOGLE_REDIRECT_URL", "http://localhost/callback")

			// Unset the specific variable being tested
			os.Unsetenv(tc.unset)

			_, err := LoadConfig()
			if err == nil {
				t.Errorf("Expected error when %s is missing", tc.unset)
			}
		})
	}
}
