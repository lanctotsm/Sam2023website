package config

import (
	"errors"
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	Port                string
	DatabaseURL         string
	GoogleClientID      string
	GoogleClientSecret  string
	GoogleRedirectURL   string
	SessionDuration     time.Duration
	SessionCookieName   string
	CookieSecure        bool
	AllowedOrigins      []string
	S3Region            string
	S3Bucket            string
	S3PublicBaseURL     string
	AWSAccessKeyID      string
	AWSSecretAccessKey  string
	AWSUseStaticCreds   bool
}

func Load() (Config, error) {
	cfg := Config{
		Port:              getEnv("PORT", "8080"),
		DatabaseURL:       os.Getenv("DATABASE_URL"),
		GoogleClientID:    os.Getenv("GOOGLE_CLIENT_ID"),
		GoogleClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		GoogleRedirectURL: os.Getenv("GOOGLE_REDIRECT_URL"),
		SessionCookieName: getEnv("SESSION_COOKIE_NAME", "cms_session"),
		SessionDuration:   getEnvDuration("SESSION_DURATION", 24*time.Hour),
		CookieSecure:      getEnvBool("COOKIE_SECURE", false),
		S3Region:          os.Getenv("S3_REGION"),
		S3Bucket:          os.Getenv("S3_BUCKET"),
		S3PublicBaseURL:   os.Getenv("S3_PUBLIC_BASE_URL"),
		AWSAccessKeyID:    os.Getenv("AWS_ACCESS_KEY_ID"),
		AWSSecretAccessKey: os.Getenv("AWS_SECRET_ACCESS_KEY"),
		AWSUseStaticCreds: getEnvBool("AWS_USE_STATIC_CREDS", false),
	}

	if origins := strings.TrimSpace(os.Getenv("ALLOWED_ORIGINS")); origins != "" {
		cfg.AllowedOrigins = strings.Split(origins, ",")
	}

	if cfg.DatabaseURL == "" {
		return Config{}, errors.New("DATABASE_URL is required")
	}
	if cfg.GoogleClientID == "" || cfg.GoogleClientSecret == "" || cfg.GoogleRedirectURL == "" {
		return Config{}, errors.New("GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URL are required")
	}
	if cfg.S3Region == "" || cfg.S3Bucket == "" || cfg.S3PublicBaseURL == "" {
		return Config{}, errors.New("S3_REGION, S3_BUCKET, S3_PUBLIC_BASE_URL are required")
	}

	return cfg, nil
}

func (c Config) HTTPAddr() string {
	return ":" + c.Port
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func getEnvBool(key string, fallback bool) bool {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	parsed, err := strconv.ParseBool(value)
	if err != nil {
		return fallback
	}
	return parsed
}

func getEnvDuration(key string, fallback time.Duration) time.Duration {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	parsed, err := time.ParseDuration(value)
	if err != nil {
		return fallback
	}
	return parsed
}
