// Package config provides application configuration management.
// It loads configuration from environment variables with validation
// and provides sensible defaults where appropriate.
package config

import (
	"fmt"
	"os"
)

// Config contains all application configuration settings.
// Configuration is loaded from environment variables with validation
// to ensure all required settings are present.
type Config struct {
	// AWS Configuration
	S3Bucket      string // S3 bucket for photo storage
	DynamoTable   string // DynamoDB table for photo metadata
	SessionsTable string // DynamoDB table for user sessions
	AlbumsTable   string // DynamoDB table for album data
	AWSRegion     string // AWS region for services
	
	// Application Configuration
	Environment string // Deployment environment (dev/staging/prod)
	
	// OAuth Configuration
	GoogleClientID     string // Google OAuth client ID
	GoogleClientSecret string // Google OAuth client secret
	GoogleRedirectURL  string // OAuth callback URL
	
	// Authorization Configuration
	AuthorizedEmail string // Email address authorized to use the application
}

// LoadConfig loads and validates configuration from environment variables.
// Required environment variables are validated, and sensible defaults
// are provided for optional settings.
//
// Returns:
//   - *Config: Validated configuration ready for use
//   - error: Configuration validation error if required variables are missing
func LoadConfig() (*Config, error) {
	config := &Config{
		S3Bucket:           os.Getenv("S3_BUCKET"),
		DynamoTable:        os.Getenv("DYNAMODB_TABLE"),
		SessionsTable:      os.Getenv("SESSIONS_TABLE"),
		AlbumsTable:        os.Getenv("ALBUMS_TABLE"),
		AWSRegion:          getEnvWithDefault("AWS_REGION", "us-east-1"),
		Environment:        getEnvWithDefault("ENVIRONMENT", "dev"),
		GoogleClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		GoogleClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		GoogleRedirectURL:  os.Getenv("GOOGLE_REDIRECT_URL"),
		AuthorizedEmail:    getEnvWithDefault("AUTHORIZED_EMAIL", "lanctotsm@gmail.com"),
	}

	if err := config.validate(); err != nil {
		return nil, fmt.Errorf("validating configuration: %w", err)
	}

	return config, nil
}

// validate ensures all required configuration values are present.
func (c *Config) validate() error {
	requiredFields := []struct {
		value string
		name  string
	}{
		{c.S3Bucket, "S3_BUCKET"},
		{c.DynamoTable, "DYNAMODB_TABLE"},
		{c.SessionsTable, "SESSIONS_TABLE"},
		{c.AlbumsTable, "ALBUMS_TABLE"},
		{c.GoogleClientID, "GOOGLE_CLIENT_ID"},
		{c.GoogleClientSecret, "GOOGLE_CLIENT_SECRET"},
		{c.GoogleRedirectURL, "GOOGLE_REDIRECT_URL"},
	}

	for _, field := range requiredFields {
		if field.value == "" {
			return fmt.Errorf("%s environment variable is required", field.name)
		}
	}

	return nil
}

// getEnvWithDefault returns environment variable value or default if not set.
func getEnvWithDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}