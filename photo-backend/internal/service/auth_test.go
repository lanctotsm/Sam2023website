package service

import (
	"fmt"
	"testing"
	"time"

	"photo-backend/internal/config"
	"photo-backend/internal/models/auth"
)

// MockSessionStorage implements storage interface for testing
type MockSessionStorage struct {
	sessions map[string]*auth.Session
}

func NewMockSessionStorage() *MockSessionStorage {
	return &MockSessionStorage{
		sessions: make(map[string]*auth.Session),
	}
}

func (m *MockSessionStorage) SaveSession(session *auth.Session) error {
	m.sessions[session.SessionToken] = session
	return nil
}

func (m *MockSessionStorage) GetSession(sessionToken string) (*auth.Session, error) {
	session, exists := m.sessions[sessionToken]
	if !exists {
		return nil, fmt.Errorf("session not found")
	}
	return session, nil
}

func (m *MockSessionStorage) UpdateSession(session *auth.Session) error {
	if _, exists := m.sessions[session.SessionToken]; !exists {
		return fmt.Errorf("session not found")
	}
	m.sessions[session.SessionToken] = session
	return nil
}

func (m *MockSessionStorage) DeleteSession(sessionToken string) error {
	delete(m.sessions, sessionToken)
	return nil
}

func (m *MockSessionStorage) ListSessionsByUser(userEmail string) ([]auth.Session, error) {
	var sessions []auth.Session
	for _, session := range m.sessions {
		if session.UserEmail == userEmail {
			sessions = append(sessions, *session)
		}
	}
	return sessions, nil
}

func (m *MockSessionStorage) CleanupExpiredSessions() error {
	now := time.Now().UTC()
	for token, session := range m.sessions {
		if now.After(session.ExpiresAt) {
			delete(m.sessions, token)
		}
	}
	return nil
}

// OAuth state management methods for testing
func (m *MockSessionStorage) SaveOAuthState(state *auth.OAuthState) error {
	// For testing, we'll store in a simple map (in real implementation this would be DynamoDB)
	return nil
}

func (m *MockSessionStorage) GetOAuthState(state string) (*auth.OAuthState, error) {
	// For testing, return a mock state record for valid-looking states
	if len(state) > 10 {
		return &auth.OAuthState{
			State:     state,
			Verifier:  "mock-verifier-" + state,
			CreatedAt: time.Now().UTC(),
			ExpiresAt: time.Now().UTC().Add(5 * time.Minute),
		}, nil
	}
	return nil, nil
}

func (m *MockSessionStorage) DeleteOAuthState(state string) error {
	// For testing, this is a no-op
	return nil
}

func TestAuthService_CreateSession(t *testing.T) {
	mockStorage := NewMockSessionStorage()
	config := &config.Config{
		AuthorizedEmail: "test@example.com",
	}
	authService := NewAuthService(config, mockStorage)

	userEmail := "test@example.com"
	session, err := authService.CreateSession(userEmail)
	if err != nil {
		t.Fatalf("CreateSession failed: %v", err)
	}

	// Verify session properties
	if session.UserEmail != userEmail {
		t.Errorf("Expected UserEmail '%s', got '%s'", userEmail, session.UserEmail)
	}

	if session.SessionToken == "" {
		t.Error("SessionToken should not be empty")
	}

	if len(session.SessionToken) != 64 { // 32 bytes hex encoded = 64 chars
		t.Errorf("Expected SessionToken length 64, got %d", len(session.SessionToken))
	}

	// Verify session is saved in storage
	savedSession, err := mockStorage.GetSession(session.SessionToken)
	if err != nil {
		t.Fatalf("Session not found in storage: %v", err)
	}

	if savedSession.UserEmail != userEmail {
		t.Errorf("Saved session UserEmail mismatch: expected '%s', got '%s'", userEmail, savedSession.UserEmail)
	}

	// Verify expiry time (should be ~24 hours from now)
	expectedExpiry := time.Now().UTC().Add(24 * time.Hour)
	timeDiff := session.ExpiresAt.Sub(expectedExpiry)
	if timeDiff > time.Minute || timeDiff < -time.Minute {
		t.Errorf("Session expiry time is not approximately 24 hours from now")
	}
}

func TestAuthService_ValidateSession(t *testing.T) {
	mockStorage := NewMockSessionStorage()
	config := &config.Config{
		AuthorizedEmail: "test@example.com",
	}
	authService := NewAuthService(config, mockStorage)

	// Test empty session token
	result, err := authService.ValidateSession("")
	if err != nil {
		t.Fatalf("ValidateSession should not return error for empty token: %v", err)
	}
	if result.Valid {
		t.Error("Empty session token should be invalid")
	}

	// Create a valid session
	userEmail := "test@example.com"
	session, err := authService.CreateSession(userEmail)
	if err != nil {
		t.Fatalf("Failed to create session: %v", err)
	}

	// Test valid session
	result, err = authService.ValidateSession(session.SessionToken)
	if err != nil {
		t.Fatalf("ValidateSession failed: %v", err)
	}
	if !result.Valid {
		t.Error("Valid session should be valid")
	}
	if result.User.Email != userEmail {
		t.Errorf("Expected user email '%s', got '%s'", userEmail, result.User.Email)
	}

	// Test invalid session token
	result, err = authService.ValidateSession("invalid-token")
	if err != nil {
		t.Fatalf("ValidateSession should not return error for invalid token: %v", err)
	}
	if result.Valid {
		t.Error("Invalid session token should be invalid")
	}

	// Test expired session
	expiredSession := &auth.Session{
		SessionToken: "expired-token",
		UserEmail:    userEmail,
		CreatedAt:    time.Now().UTC().Add(-25 * time.Hour),
		ExpiresAt:    time.Now().UTC().Add(-1 * time.Hour),
		LastActivity: time.Now().UTC().Add(-2 * time.Hour),
	}
	mockStorage.SaveSession(expiredSession)

	result, err = authService.ValidateSession("expired-token")
	if err != nil {
		t.Fatalf("ValidateSession should not return error for expired token: %v", err)
	}
	if result.Valid {
		t.Error("Expired session should be invalid")
	}
	if result.Error != "session expired" {
		t.Errorf("Expected error 'session expired', got '%s'", result.Error)
	}

	// Verify expired session was cleaned up
	_, err = mockStorage.GetSession("expired-token")
	if err == nil {
		t.Error("Expired session should have been deleted")
	}
}

func TestAuthService_ExpireSession(t *testing.T) {
	mockStorage := NewMockSessionStorage()
	config := &config.Config{
		AuthorizedEmail: "test@example.com",
	}
	authService := NewAuthService(config, mockStorage)

	// Create a session
	userEmail := "test@example.com"
	session, err := authService.CreateSession(userEmail)
	if err != nil {
		t.Fatalf("Failed to create session: %v", err)
	}

	// Verify session exists
	_, err = mockStorage.GetSession(session.SessionToken)
	if err != nil {
		t.Fatalf("Session should exist: %v", err)
	}

	// Expire the session
	err = authService.ExpireSession(session.SessionToken)
	if err != nil {
		t.Fatalf("ExpireSession failed: %v", err)
	}

	// Verify session is deleted
	_, err = mockStorage.GetSession(session.SessionToken)
	if err == nil {
		t.Error("Session should have been deleted")
	}
}

func TestAuthService_RefreshSession(t *testing.T) {
	mockStorage := NewMockSessionStorage()
	config := &config.Config{
		AuthorizedEmail: "test@example.com",
	}
	authService := NewAuthService(config, mockStorage)

	// Create a session
	userEmail := "test@example.com"
	session, err := authService.CreateSession(userEmail)
	if err != nil {
		t.Fatalf("Failed to create session: %v", err)
	}

	originalExpiry := session.ExpiresAt

	// Wait a moment to ensure time difference
	time.Sleep(10 * time.Millisecond)

	// Refresh the session
	refreshedSession, err := authService.RefreshSession(session.SessionToken)
	if err != nil {
		t.Fatalf("RefreshSession failed: %v", err)
	}

	// Verify expiry time was extended
	if !refreshedSession.ExpiresAt.After(originalExpiry) {
		t.Error("Session expiry should have been extended")
	}

	// Verify last activity was updated (allow for small time differences)
	if refreshedSession.LastActivity.Before(session.LastActivity) {
		t.Error("Last activity should have been updated")
	}

	// Test refreshing expired session
	expiredSession := &auth.Session{
		SessionToken: "expired-token",
		UserEmail:    userEmail,
		CreatedAt:    time.Now().UTC().Add(-25 * time.Hour),
		ExpiresAt:    time.Now().UTC().Add(-1 * time.Hour),
		LastActivity: time.Now().UTC().Add(-2 * time.Hour),
	}
	mockStorage.SaveSession(expiredSession)

	_, err = authService.RefreshSession("expired-token")
	if err == nil {
		t.Error("Refreshing expired session should fail")
	}
}

func TestAuthService_GetActiveSessions(t *testing.T) {
	mockStorage := NewMockSessionStorage()
	config := &config.Config{
		AuthorizedEmail: "test@example.com",
	}
	authService := NewAuthService(config, mockStorage)

	userEmail := "test@example.com"

	// Create multiple sessions
	session1, _ := authService.CreateSession(userEmail)
	session2, _ := authService.CreateSession(userEmail)

	// Create an expired session
	expiredSession := &auth.Session{
		SessionToken: "expired-token",
		UserEmail:    userEmail,
		CreatedAt:    time.Now().UTC().Add(-25 * time.Hour),
		ExpiresAt:    time.Now().UTC().Add(-1 * time.Hour),
		LastActivity: time.Now().UTC().Add(-2 * time.Hour),
	}
	mockStorage.SaveSession(expiredSession)

	// Get active sessions
	activeSessions, err := authService.GetActiveSessions(userEmail)
	if err != nil {
		t.Fatalf("GetActiveSessions failed: %v", err)
	}

	// Should only return non-expired sessions
	if len(activeSessions) != 2 {
		t.Errorf("Expected 2 active sessions, got %d", len(activeSessions))
	}

	// Verify the correct sessions are returned
	sessionTokens := make(map[string]bool)
	for _, session := range activeSessions {
		sessionTokens[session.SessionToken] = true
	}

	if !sessionTokens[session1.SessionToken] {
		t.Error("Session1 should be in active sessions")
	}
	if !sessionTokens[session2.SessionToken] {
		t.Error("Session2 should be in active sessions")
	}
	if sessionTokens["expired-token"] {
		t.Error("Expired session should not be in active sessions")
	}
}

func TestAuthService_ExpireAllUserSessions(t *testing.T) {
	mockStorage := NewMockSessionStorage()
	config := &config.Config{
		AuthorizedEmail: "test@example.com",
	}
	authService := NewAuthService(config, mockStorage)

	userEmail := "test@example.com"

	// Create multiple sessions
	session1, _ := authService.CreateSession(userEmail)
	session2, _ := authService.CreateSession(userEmail)

	// Verify sessions exist
	_, err := mockStorage.GetSession(session1.SessionToken)
	if err != nil {
		t.Fatalf("Session1 should exist: %v", err)
	}
	_, err = mockStorage.GetSession(session2.SessionToken)
	if err != nil {
		t.Fatalf("Session2 should exist: %v", err)
	}

	// Expire all user sessions
	err = authService.ExpireAllUserSessions(userEmail)
	if err != nil {
		t.Fatalf("ExpireAllUserSessions failed: %v", err)
	}

	// Verify all sessions are deleted
	_, err = mockStorage.GetSession(session1.SessionToken)
	if err == nil {
		t.Error("Session1 should have been deleted")
	}
	_, err = mockStorage.GetSession(session2.SessionToken)
	if err == nil {
		t.Error("Session2 should have been deleted")
	}
}

func TestAuthService_ValidateGoogleToken(t *testing.T) {
	// This test has been disabled as ValidateGoogleToken was replaced with ValidateIDToken
	t.Skip("ValidateGoogleToken has been replaced with ValidateIDToken - test needs refactoring")
	
	/*
	config := &config.Config{
		AuthorizedEmail: "lanctotsm@gmail.com",
	}
	mockStorage := NewMockSessionStorage()
	authService := NewAuthService(config, mockStorage)

	// Create a mock Google OAuth server
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/tokeninfo" {
			// Parse the request to get the token
			r.ParseForm()
			token := r.FormValue("access_token")

			switch token {
			case "valid-token":
				tokenInfo := auth.IDTokenClaims{
					Email:         "lanctotsm@gmail.com",
					EmailVerified: true,
					Name:          "Test User",
					Picture:       "https://example.com/picture.jpg",
					Iat:           time.Now().Unix() - 300, // 5 minutes ago
					Exp:           time.Now().Unix() + 3600, // 1 hour from now
					Amr:           []string{"mfa", "pwd"}, // Multi-factor auth
				}
				json.NewEncoder(w).Encode(tokenInfo)
			case "unauthorized-user":
				tokenInfo := auth.IDTokenClaims{
					Email:         "unauthorized@example.com",
					EmailVerified: true,
					Name:          "Unauthorized User",
					Picture:       "https://example.com/picture.jpg",
					Iat:           time.Now().Unix() - 300,
					Exp:           time.Now().Unix() + 3600,
				}
				json.NewEncoder(w).Encode(tokenInfo)
			case "unverified-email":
				tokenInfo := auth.IDTokenClaims{
					Email:         "lanctotsm@gmail.com",
					EmailVerified: false,
					Name:          "Test User",
					Picture:       "https://example.com/picture.jpg",
					Iat:           time.Now().Unix() - 300,
					Exp:           time.Now().Unix() + 3600,
				}
				json.NewEncoder(w).Encode(tokenInfo)
			case "expired-token":
				tokenInfo := auth.IDTokenClaims{
					Email:         "lanctotsm@gmail.com",
					EmailVerified: true,
					Name:          "Test User",
					Picture:       "https://example.com/picture.jpg",
					Iat:           time.Now().Unix() - 7200, // 2 hours ago
					Exp:           time.Now().Unix() - 3600, // 1 hour ago (expired)
				}
				json.NewEncoder(w).Encode(tokenInfo)
			case "old-token":
				tokenInfo := auth.IDTokenClaims{
					Email:         "lanctotsm@gmail.com",
					EmailVerified: true,
					Name:          "Test User",
					Picture:       "https://example.com/picture.jpg",
					Iat:           time.Now().Unix() - 7200, // 2 hours ago (too old for 2FA)
					Exp:           time.Now().Unix() + 3600, // 1 hour from now
				}
				json.NewEncoder(w).Encode(tokenInfo)
			default:
				w.WriteHeader(http.StatusBadRequest)
				w.Write([]byte("Invalid token"))
			}
		}
	}))
	defer mockServer.Close()
	*/
}

func TestAuthService_CleanupExpiredSessions(t *testing.T) {
	mockStorage := NewMockSessionStorage()
	config := &config.Config{
		AuthorizedEmail: "test@example.com",
	}
	authService := NewAuthService(config, mockStorage)

	userEmail := "test@example.com"

	// Create a valid session
	validSession, _ := authService.CreateSession(userEmail)

	// Create an expired session
	expiredSession := &auth.Session{
		SessionToken: "expired-token",
		UserEmail:    userEmail,
		CreatedAt:    time.Now().UTC().Add(-25 * time.Hour),
		ExpiresAt:    time.Now().UTC().Add(-1 * time.Hour),
		LastActivity: time.Now().UTC().Add(-2 * time.Hour),
	}
	mockStorage.SaveSession(expiredSession)

	// Verify both sessions exist
	if len(mockStorage.sessions) != 2 {
		t.Fatalf("Expected 2 sessions, got %d", len(mockStorage.sessions))
	}

	// Cleanup expired sessions
	err := authService.CleanupExpiredSessions()
	if err != nil {
		t.Fatalf("CleanupExpiredSessions failed: %v", err)
	}

	// Verify only valid session remains
	if len(mockStorage.sessions) != 1 {
		t.Errorf("Expected 1 session after cleanup, got %d", len(mockStorage.sessions))
	}

	// Verify the correct session remains
	_, err = mockStorage.GetSession(validSession.SessionToken)
	if err != nil {
		t.Error("Valid session should still exist")
	}

	_, err = mockStorage.GetSession("expired-token")
	if err == nil {
		t.Error("Expired session should have been deleted")
	}
}

func TestAuthService_GenerateOAuthState(t *testing.T) {
	mockStorage := NewMockSessionStorage()
	config := &config.Config{
		AuthorizedEmail: "test@example.com",
	}
	authService := NewAuthService(config, mockStorage)

	// Generate OAuth state
	state, verifier, err := authService.GenerateOAuthState()
	if err != nil {
		t.Fatalf("GenerateOAuthState failed: %v", err)
	}

	// Verify state properties
	if state == "" {
		t.Error("Generated state should not be empty")
	}
	
	if verifier == "" {
		t.Error("Generated verifier should not be empty")
	}

	if len(state) != 64 { // 32 bytes hex encoded = 64 chars
		t.Errorf("Expected state length 64, got %d", len(state))
	}

	// Generate another state and verify they're different
	state2, verifier2, err := authService.GenerateOAuthState()
	if err != nil {
		t.Fatalf("Second GenerateOAuthState failed: %v", err)
	}
	
	_ = verifier2 // Avoid unused variable warning

	if state == state2 {
		t.Error("Generated states should be unique")
	}
}

func TestAuthService_ValidateOAuthState(t *testing.T) {
	mockStorage := NewMockSessionStorage()
	config := &config.Config{
		AuthorizedEmail: "test@example.com",
	}
	authService := NewAuthService(config, mockStorage)

	// Test empty state
	_, err := authService.ValidateOAuthState("")
	if err == nil {
		t.Error("ValidateOAuthState should error on empty state")
	}

	// Test valid state (mock always returns true for states > 10 chars)
	validState := "valid-state-parameter-12345"
	verifier, err := authService.ValidateOAuthState(validState)
	if err != nil {
		t.Fatalf("ValidateOAuthState failed: %v", err)
	}
	if verifier == "" {
		t.Error("Valid state should return a verifier")
	}

	// Test invalid state (mock returns nil for short states)
	invalidState := "short"
	verifier, err = authService.ValidateOAuthState(invalidState)
	if err == nil {
		t.Error("Invalid state should return an error")
	}
	if verifier != "" {
		t.Error("Invalid state should not return a verifier")
	}
}

func TestAuthService_GetGoogleOAuthURL(t *testing.T) {
	config := &config.Config{
		GoogleClientID:     "test-client-id",
		GoogleRedirectURL:  "https://example.com/callback",
		AuthorizedEmail:    "test@example.com",
	}
	mockStorage := NewMockSessionStorage()
	authService := NewAuthService(config, mockStorage)

	state := "test-state-parameter"
	verifier := "test-verifier-12345"
	oauthURL := authService.GetGoogleOAuthURL(state, verifier)

	// Verify URL contains expected parameters
	if oauthURL == "" {
		t.Error("OAuth URL should not be empty")
	}

	t.Logf("Generated OAuth URL: %s", oauthURL)

	// Check that URL contains required parameters
	expectedParams := []string{
		"client_id=test-client-id",
		"redirect_uri=https%3A%2F%2Fexample.com%2Fcallback", // Fixed URL encoding
		"response_type=code",
		"scope=openid+email+profile",
		"state=test-state-parameter",
		"access_type=offline",
		"prompt=consent",
	}

	for _, param := range expectedParams {
		if !contains(oauthURL, param) {
			t.Errorf("OAuth URL should contain parameter: %s", param)
		}
	}
}

// Helper function to check if string contains substring
func contains(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

func TestAuthService_2FAVerification(t *testing.T) {
	config := &config.Config{
		AuthorizedEmail: "test@example.com",
	}
	mockStorage := NewMockSessionStorage()
	authService := NewAuthService(config, mockStorage)

	// Test 2FA verification with recent token (should pass)
	recentTokenInfo := &auth.IDTokenClaims{
		Email:         "test@example.com",
		EmailVerified: true,
		Name:          "Test User",
		Iat:           time.Now().Unix() - 300, // 5 minutes ago
		Exp:           time.Now().Unix() + 3600, // 1 hour from now
		Amr:           []string{"mfa", "pwd"}, // Multi-factor auth
	}

	err := authService.verify2FA(recentTokenInfo)
	if err != nil {
		t.Errorf("Recent token should pass 2FA verification: %v", err)
	}

	// Test 2FA verification with old token (should fail)
	oldTokenInfo := &auth.IDTokenClaims{
		Email:         "test@example.com",
		EmailVerified: true,
		Name:          "Test User",
		Iat:           time.Now().Unix() - 7200, // 2 hours ago (too old)
		Exp:           time.Now().Unix() + 3600, // 1 hour from now
	}

	err = authService.verify2FA(oldTokenInfo)
	if err == nil {
		t.Error("Old token should fail 2FA verification")
	}
}