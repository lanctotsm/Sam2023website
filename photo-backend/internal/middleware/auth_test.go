package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"testing"
	"time"

	"github.com/aws/aws-lambda-go/events"

	"photo-backend/internal/models/auth"
)

// MockAuthService implements auth service interface for testing
type MockAuthService struct {
	sessions map[string]*auth.SessionValidationResult
}

func NewMockAuthService() *MockAuthService {
	return &MockAuthService{
		sessions: make(map[string]*auth.SessionValidationResult),
	}
}

func (m *MockAuthService) ValidateSession(sessionToken string) (*auth.SessionValidationResult, error) {
	result, exists := m.sessions[sessionToken]
	if !exists {
		return &auth.SessionValidationResult{
			Valid: false,
			Error: "invalid session token",
		}, nil
	}
	return result, nil
}

func (m *MockAuthService) AddValidSession(token string, user *auth.User) {
	m.sessions[token] = &auth.SessionValidationResult{
		Valid: true,
		Session: &auth.Session{
			SessionToken: token,
			UserEmail:    user.Email,
			CreatedAt:    time.Now().UTC(),
			ExpiresAt:    time.Now().UTC().Add(24 * time.Hour),
			LastActivity: time.Now().UTC(),
		},
		User: user,
	}
}

func (m *MockAuthService) AddInvalidSession(token string, errorMsg string) {
	m.sessions[token] = &auth.SessionValidationResult{
		Valid: false,
		Error: errorMsg,
	}
}

func TestAuthMiddleware_RequireAuth(t *testing.T) {
	mockAuthService := NewMockAuthService()
	middleware := NewAuthMiddleware(mockAuthService)

	// Test handler that should be called when authentication succeeds
	testHandler := func(ctx context.Context, request events.APIGatewayProxyRequest, user *auth.User) (events.APIGatewayProxyResponse, error) {
		return events.APIGatewayProxyResponse{
			StatusCode: http.StatusOK,
			Body:       `{"message": "success", "user": "` + user.Email + `"}`,
		}, nil
	}

	wrappedHandler := middleware.RequireAuth(testHandler)

	// Test case 1: Missing session token
	t.Run("Missing session token", func(t *testing.T) {
		request := events.APIGatewayProxyRequest{
			Headers: map[string]string{},
		}

		response, err := wrappedHandler(context.Background(), request)
		if err != nil {
			t.Fatalf("Handler returned error: %v", err)
		}

		if response.StatusCode != http.StatusUnauthorized {
			t.Errorf("Expected status %d, got %d", http.StatusUnauthorized, response.StatusCode)
		}

		var responseBody map[string]interface{}
		if err := json.Unmarshal([]byte(response.Body), &responseBody); err != nil {
			t.Fatalf("Failed to parse response body: %v", err)
		}

		if responseBody["error"] != "Authentication required. Please log in." {
			t.Errorf("Unexpected error message: %s", responseBody["error"])
		}
	})

	// Test case 2: Valid session token
	t.Run("Valid session token", func(t *testing.T) {
		user := &auth.User{
			Email: "test@example.com",
			Name:  "Test User",
		}
		mockAuthService.AddValidSession("valid-token", user)

		request := events.APIGatewayProxyRequest{
			Headers: map[string]string{
				"Authorization": "Bearer valid-token",
			},
		}

		response, err := wrappedHandler(context.Background(), request)
		if err != nil {
			t.Fatalf("Handler returned error: %v", err)
		}

		if response.StatusCode != http.StatusOK {
			t.Errorf("Expected status %d, got %d", http.StatusOK, response.StatusCode)
		}

		var responseBody map[string]interface{}
		if err := json.Unmarshal([]byte(response.Body), &responseBody); err != nil {
			t.Fatalf("Failed to parse response body: %v", err)
		}

		if responseBody["user"] != user.Email {
			t.Errorf("Expected user email %s, got %s", user.Email, responseBody["user"])
		}
	})

	// Test case 3: Invalid session token
	t.Run("Invalid session token", func(t *testing.T) {
		mockAuthService.AddInvalidSession("invalid-token", "invalid session token")

		request := events.APIGatewayProxyRequest{
			Headers: map[string]string{
				"Authorization": "Bearer invalid-token",
			},
		}

		response, err := wrappedHandler(context.Background(), request)
		if err != nil {
			t.Fatalf("Handler returned error: %v", err)
		}

		if response.StatusCode != http.StatusUnauthorized {
			t.Errorf("Expected status %d, got %d", http.StatusUnauthorized, response.StatusCode)
		}

		var responseBody map[string]interface{}
		if err := json.Unmarshal([]byte(response.Body), &responseBody); err != nil {
			t.Fatalf("Failed to parse response body: %v", err)
		}

		if responseBody["error"] != "Invalid session. Please log in again." {
			t.Errorf("Unexpected error message: %s", responseBody["error"])
		}
	})

	// Test case 4: Expired session token
	t.Run("Expired session token", func(t *testing.T) {
		mockAuthService.AddInvalidSession("expired-token", "session expired")

		request := events.APIGatewayProxyRequest{
			Headers: map[string]string{
				"Authorization": "Bearer expired-token",
			},
		}

		response, err := wrappedHandler(context.Background(), request)
		if err != nil {
			t.Fatalf("Handler returned error: %v", err)
		}

		if response.StatusCode != http.StatusUnauthorized {
			t.Errorf("Expected status %d, got %d", http.StatusUnauthorized, response.StatusCode)
		}

		var responseBody map[string]interface{}
		if err := json.Unmarshal([]byte(response.Body), &responseBody); err != nil {
			t.Fatalf("Failed to parse response body: %v", err)
		}

		if responseBody["error"] != "Session expired. Please log in again." {
			t.Errorf("Unexpected error message: %s", responseBody["error"])
		}
	})

	// Test case 5: Session token from cookie
	t.Run("Session token from cookie", func(t *testing.T) {
		user := &auth.User{
			Email: "test@example.com",
			Name:  "Test User",
		}
		mockAuthService.AddValidSession("cookie-token", user)

		request := events.APIGatewayProxyRequest{
			Headers: map[string]string{
				"Cookie": "session=cookie-token; other=value",
			},
		}

		response, err := wrappedHandler(context.Background(), request)
		if err != nil {
			t.Fatalf("Handler returned error: %v", err)
		}

		if response.StatusCode != http.StatusOK {
			t.Errorf("Expected status %d, got %d", http.StatusOK, response.StatusCode)
		}
	})
}

func TestAuthMiddleware_OptionalAuth(t *testing.T) {
	mockAuthService := NewMockAuthService()
	middleware := NewAuthMiddleware(mockAuthService)

	// Test handler that should be called regardless of authentication
	testHandler := func(ctx context.Context, request events.APIGatewayProxyRequest, user *auth.User) (events.APIGatewayProxyResponse, error) {
		userEmail := "anonymous"
		if user != nil {
			userEmail = user.Email
		}
		return events.APIGatewayProxyResponse{
			StatusCode: http.StatusOK,
			Body:       `{"message": "success", "user": "` + userEmail + `"}`,
		}, nil
	}

	wrappedHandler := middleware.OptionalAuth(testHandler)

	// Test case 1: No session token (anonymous access)
	t.Run("No session token", func(t *testing.T) {
		request := events.APIGatewayProxyRequest{
			Headers: map[string]string{},
		}

		response, err := wrappedHandler(context.Background(), request)
		if err != nil {
			t.Fatalf("Handler returned error: %v", err)
		}

		if response.StatusCode != http.StatusOK {
			t.Errorf("Expected status %d, got %d", http.StatusOK, response.StatusCode)
		}

		var responseBody map[string]interface{}
		if err := json.Unmarshal([]byte(response.Body), &responseBody); err != nil {
			t.Fatalf("Failed to parse response body: %v", err)
		}

		if responseBody["user"] != "anonymous" {
			t.Errorf("Expected anonymous user, got %s", responseBody["user"])
		}
	})

	// Test case 2: Valid session token
	t.Run("Valid session token", func(t *testing.T) {
		user := &auth.User{
			Email: "test@example.com",
			Name:  "Test User",
		}
		mockAuthService.AddValidSession("valid-token", user)

		request := events.APIGatewayProxyRequest{
			Headers: map[string]string{
				"Authorization": "Bearer valid-token",
			},
		}

		response, err := wrappedHandler(context.Background(), request)
		if err != nil {
			t.Fatalf("Handler returned error: %v", err)
		}

		if response.StatusCode != http.StatusOK {
			t.Errorf("Expected status %d, got %d", http.StatusOK, response.StatusCode)
		}

		var responseBody map[string]interface{}
		if err := json.Unmarshal([]byte(response.Body), &responseBody); err != nil {
			t.Fatalf("Failed to parse response body: %v", err)
		}

		if responseBody["user"] != user.Email {
			t.Errorf("Expected user email %s, got %s", user.Email, responseBody["user"])
		}
	})

	// Test case 3: Invalid session token (should still work as anonymous)
	t.Run("Invalid session token", func(t *testing.T) {
		request := events.APIGatewayProxyRequest{
			Headers: map[string]string{
				"Authorization": "Bearer invalid-token",
			},
		}

		response, err := wrappedHandler(context.Background(), request)
		if err != nil {
			t.Fatalf("Handler returned error: %v", err)
		}

		if response.StatusCode != http.StatusOK {
			t.Errorf("Expected status %d, got %d", http.StatusOK, response.StatusCode)
		}

		var responseBody map[string]interface{}
		if err := json.Unmarshal([]byte(response.Body), &responseBody); err != nil {
			t.Fatalf("Failed to parse response body: %v", err)
		}

		if responseBody["user"] != "anonymous" {
			t.Errorf("Expected anonymous user, got %s", responseBody["user"])
		}
	})
}

func TestAuthMiddleware_RequireAuthorizedUser(t *testing.T) {
	mockAuthService := NewMockAuthService()
	middleware := NewAuthMiddleware(mockAuthService)

	authorizedEmail := "authorized@example.com"

	// Test handler
	testHandler := func(ctx context.Context, request events.APIGatewayProxyRequest, user *auth.User) (events.APIGatewayProxyResponse, error) {
		return events.APIGatewayProxyResponse{
			StatusCode: http.StatusOK,
			Body:       `{"message": "success"}`,
		}, nil
	}

	wrappedHandler := middleware.RequireAuthorizedUser(authorizedEmail, testHandler)

	// Test case 1: Authorized user
	t.Run("Authorized user", func(t *testing.T) {
		user := &auth.User{
			Email: authorizedEmail,
			Name:  "Authorized User",
		}
		mockAuthService.AddValidSession("auth-token", user)

		request := events.APIGatewayProxyRequest{
			Headers: map[string]string{
				"Authorization": "Bearer auth-token",
			},
		}

		response, err := wrappedHandler(context.Background(), request)
		if err != nil {
			t.Fatalf("Handler returned error: %v", err)
		}

		if response.StatusCode != http.StatusOK {
			t.Errorf("Expected status %d, got %d", http.StatusOK, response.StatusCode)
		}
	})

	// Test case 2: Unauthorized user (different email)
	t.Run("Unauthorized user", func(t *testing.T) {
		user := &auth.User{
			Email: "unauthorized@example.com",
			Name:  "Unauthorized User",
		}
		mockAuthService.AddValidSession("unauth-token", user)

		request := events.APIGatewayProxyRequest{
			Headers: map[string]string{
				"Authorization": "Bearer unauth-token",
			},
		}

		response, err := wrappedHandler(context.Background(), request)
		if err != nil {
			t.Fatalf("Handler returned error: %v", err)
		}

		if response.StatusCode != http.StatusForbidden {
			t.Errorf("Expected status %d, got %d", http.StatusForbidden, response.StatusCode)
		}

		var responseBody map[string]interface{}
		if err := json.Unmarshal([]byte(response.Body), &responseBody); err != nil {
			t.Fatalf("Failed to parse response body: %v", err)
		}

		expectedError := "Access denied. Only " + authorizedEmail + " is authorized."
		if responseBody["error"] != expectedError {
			t.Errorf("Expected error message '%s', got '%s'", expectedError, responseBody["error"])
		}
	})
}

func TestAuthMiddleware_ExtractSessionToken(t *testing.T) {
	mockAuthService := NewMockAuthService()
	middleware := NewAuthMiddleware(mockAuthService)

	testCases := []struct {
		name     string
		headers  map[string]string
		expected string
	}{
		{
			name: "Authorization header with Bearer",
			headers: map[string]string{
				"Authorization": "Bearer test-token",
			},
			expected: "test-token",
		},
		{
			name: "Lowercase authorization header",
			headers: map[string]string{
				"authorization": "Bearer test-token",
			},
			expected: "test-token",
		},
		{
			name: "Cookie header",
			headers: map[string]string{
				"Cookie": "session=cookie-token; other=value",
			},
			expected: "cookie-token",
		},
		{
			name: "Lowercase cookie header",
			headers: map[string]string{
				"cookie": "session=cookie-token; other=value",
			},
			expected: "cookie-token",
		},
		{
			name: "No session token",
			headers: map[string]string{
				"Content-Type": "application/json",
			},
			expected: "",
		},
		{
			name: "Authorization without Bearer",
			headers: map[string]string{
				"Authorization": "Basic dGVzdA==",
			},
			expected: "",
		},
		{
			name: "Cookie without session",
			headers: map[string]string{
				"Cookie": "other=value; another=test",
			},
			expected: "",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			request := events.APIGatewayProxyRequest{
				Headers: tc.headers,
			}

			result := middleware.tokenExtractor.ExtractSessionToken(request)
			if result != tc.expected {
				t.Errorf("Expected '%s', got '%s'", tc.expected, result)
			}
		})
	}
}

func TestAuthMiddleware_GetUserFromSessionToken(t *testing.T) {
	mockAuthService := NewMockAuthService()
	middleware := NewAuthMiddleware(mockAuthService)

	// Test case 1: Empty token
	t.Run("Empty token", func(t *testing.T) {
		_, err := middleware.GetUserFromSessionToken("")
		if err == nil {
			t.Error("Expected error for empty token")
		}
	})

	// Test case 2: Valid token
	t.Run("Valid token", func(t *testing.T) {
		user := &auth.User{
			Email: "test@example.com",
			Name:  "Test User",
		}
		mockAuthService.AddValidSession("valid-token", user)

		result, err := middleware.GetUserFromSessionToken("valid-token")
		if err != nil {
			t.Fatalf("Unexpected error: %v", err)
		}

		if result.Email != user.Email {
			t.Errorf("Expected email %s, got %s", user.Email, result.Email)
		}
	})

	// Test case 3: Invalid token
	t.Run("Invalid token", func(t *testing.T) {
		_, err := middleware.GetUserFromSessionToken("invalid-token")
		if err == nil {
			t.Error("Expected error for invalid token")
		}
	})
}

func TestGetUserFromContext(t *testing.T) {
	user := &auth.User{
		Email: "test@example.com",
		Name:  "Test User",
	}

	// Test with user in context
	ctx := context.WithValue(context.Background(), "user", user)
	result := GetUserFromContext(ctx)
	if result == nil {
		t.Error("Expected user from context, got nil")
	}
	if result.Email != user.Email {
		t.Errorf("Expected email %s, got %s", user.Email, result.Email)
	}

	// Test with no user in context
	emptyCtx := context.Background()
	result = GetUserFromContext(emptyCtx)
	if result != nil {
		t.Error("Expected nil user from empty context")
	}
}

func TestGetSessionFromContext(t *testing.T) {
	session := &auth.Session{
		SessionToken: "test-token",
		UserEmail:    "test@example.com",
		CreatedAt:    time.Now().UTC(),
		ExpiresAt:    time.Now().UTC().Add(24 * time.Hour),
		LastActivity: time.Now().UTC(),
	}

	// Test with session in context
	ctx := context.WithValue(context.Background(), "session", session)
	result := GetSessionFromContext(ctx)
	if result == nil {
		t.Error("Expected session from context, got nil")
	}
	if result.SessionToken != session.SessionToken {
		t.Errorf("Expected token %s, got %s", session.SessionToken, result.SessionToken)
	}

	// Test with no session in context
	emptyCtx := context.Background()
	result = GetSessionFromContext(emptyCtx)
	if result != nil {
		t.Error("Expected nil session from empty context")
	}
}