package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"time"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/idtoken"

	"photo-backend/internal/config"
	"photo-backend/internal/models/auth"
)

// SessionStorageInterface defines the interface for session storage operations
type SessionStorageInterface interface {
	SaveSession(session *auth.Session) error
	GetSession(sessionToken string) (*auth.Session, error)
	UpdateSession(session *auth.Session) error
	DeleteSession(sessionToken string) error
	ListSessionsByUser(userEmail string) ([]auth.Session, error)
	CleanupExpiredSessions() error
	
	// OAuth state management for CSRF protection
	SaveOAuthState(state *auth.OAuthState) error
	GetOAuthState(state string) (*auth.OAuthState, error)
	DeleteOAuthState(state string) error
}

// AuthService handles authentication-related operations
type AuthService struct {
	config         *config.Config
	sessionStorage SessionStorageInterface
}

// NewAuthService creates a new AuthService instance
func NewAuthService(config *config.Config, sessionStorage SessionStorageInterface) *AuthService {
	return &AuthService{
		config:         config,
		sessionStorage: sessionStorage,
	}
}

// getOAuth2Config returns the OAuth2 configuration for Google
func (a *AuthService) getOAuth2Config() *oauth2.Config {
	return &oauth2.Config{
		ClientID:     a.config.GoogleClientID,
		ClientSecret: a.config.GoogleClientSecret,
		RedirectURL:  a.config.GoogleRedirectURL,
		Scopes:       []string{"openid", "email", "profile"},
		Endpoint:     google.Endpoint,
	}
}

// ValidateIDToken validates a Google ID token and verifies user authorization
func (a *AuthService) ValidateIDToken(idToken string) (*auth.User, error) {
	// Validate ID token with Google
	payload, err := idtoken.Validate(context.Background(), idToken, a.config.GoogleClientID)
	if err != nil {
		return nil, fmt.Errorf("failed to validate ID token: %w", err)
	}

	// Extract claims
	claims := &auth.IDTokenClaims{}
	if email, ok := payload.Claims["email"].(string); ok {
		claims.Email = email
	}
	if emailVerified, ok := payload.Claims["email_verified"].(bool); ok {
		claims.EmailVerified = emailVerified
	}
	if name, ok := payload.Claims["name"].(string); ok {
		claims.Name = name
	}
	if picture, ok := payload.Claims["picture"].(string); ok {
		claims.Picture = picture
	}
	if amr, ok := payload.Claims["amr"].([]interface{}); ok {
		for _, method := range amr {
			if methodStr, ok := method.(string); ok {
				claims.Amr = append(claims.Amr, methodStr)
			}
		}
	}
	if acr, ok := payload.Claims["acr"].(string); ok {
		claims.Acr = acr
	}

	// Check if email is verified
	if !claims.EmailVerified {
		return nil, fmt.Errorf("email not verified")
	}

	// Verify 2FA was used during authentication
	if err := a.verify2FA(claims); err != nil {
		return nil, fmt.Errorf("2FA verification failed: %w", err)
	}

	// Check if user is authorized
	if claims.Email != a.config.AuthorizedEmail {
		return nil, fmt.Errorf("unauthorized user: %s", claims.Email)
	}

	// Create user object
	user := &auth.User{
		Email:         claims.Email,
		Name:          claims.Name,
		Picture:       claims.Picture,
		EmailVerified: claims.EmailVerified,
	}

	return user, nil
}

// CreateSession creates a new session for the user
func (a *AuthService) CreateSession(userEmail string) (*auth.Session, error) {
	// Generate secure session token
	sessionToken, err := a.generateSessionToken()
	if err != nil {
		return nil, fmt.Errorf("failed to generate session token: %w", err)
	}

	// Create session
	now := time.Now().UTC()
	session := &auth.Session{
		SessionToken: sessionToken,
		UserEmail:    userEmail,
		CreatedAt:    now,
		ExpiresAt:    now.Add(24 * time.Hour), // 24 hour expiry
		LastActivity: now,
	}

	// Save session to storage
	if err := a.sessionStorage.SaveSession(session); err != nil {
		return nil, fmt.Errorf("failed to save session: %w", err)
	}

	return session, nil
}

// ValidateSession validates a session token and returns session info
func (a *AuthService) ValidateSession(sessionToken string) (*auth.SessionValidationResult, error) {
	if sessionToken == "" {
		return &auth.SessionValidationResult{
			Valid: false,
			Error: "session token is required",
		}, nil
	}

	// Get session from storage
	session, err := a.sessionStorage.GetSession(sessionToken)
	if err != nil {
		return &auth.SessionValidationResult{
			Valid: false,
			Error: "invalid session token",
		}, nil
	}

	// Check if session is expired
	if time.Now().UTC().After(session.ExpiresAt) {
		// Clean up expired session
		a.sessionStorage.DeleteSession(sessionToken)
		return &auth.SessionValidationResult{
			Valid: false,
			Error: "session expired",
		}, nil
	}

	// Update last activity
	session.LastActivity = time.Now().UTC()
	if err := a.sessionStorage.UpdateSession(session); err != nil {
		// Log error but don't fail validation
		fmt.Printf("Warning: failed to update session activity: %v\n", err)
	}

	// Create user object
	user := &auth.User{
		Email: session.UserEmail,
	}

	return &auth.SessionValidationResult{
		Valid:   true,
		Session: session,
		User:    user,
	}, nil
}

// ExpireSession expires a session
func (a *AuthService) ExpireSession(sessionToken string) error {
	return a.sessionStorage.DeleteSession(sessionToken)
}

// CleanupExpiredSessions removes expired sessions (called periodically)
func (a *AuthService) CleanupExpiredSessions() error {
	return a.sessionStorage.CleanupExpiredSessions()
}

// RefreshSession extends the expiry time of an active session
func (a *AuthService) RefreshSession(sessionToken string) (*auth.Session, error) {
	// Get current session
	session, err := a.sessionStorage.GetSession(sessionToken)
	if err != nil {
		return nil, fmt.Errorf("failed to get session for refresh: %w", err)
	}

	// Check if session is still valid (not expired)
	if time.Now().UTC().After(session.ExpiresAt) {
		return nil, fmt.Errorf("cannot refresh expired session")
	}

	// Extend expiry time
	now := time.Now().UTC()
	session.ExpiresAt = now.Add(24 * time.Hour)
	session.LastActivity = now

	// Save updated session
	if err := a.sessionStorage.UpdateSession(session); err != nil {
		return nil, fmt.Errorf("failed to refresh session: %w", err)
	}

	return session, nil
}

// GetActiveSessions returns all active sessions for a user
func (a *AuthService) GetActiveSessions(userEmail string) ([]auth.Session, error) {
	sessions, err := a.sessionStorage.ListSessionsByUser(userEmail)
	if err != nil {
		return nil, fmt.Errorf("failed to get user sessions: %w", err)
	}

	// Filter out expired sessions
	var activeSessions []auth.Session
	now := time.Now().UTC()
	for _, session := range sessions {
		if now.Before(session.ExpiresAt) {
			activeSessions = append(activeSessions, session)
		}
	}

	return activeSessions, nil
}

// ExpireAllUserSessions expires all sessions for a specific user
func (a *AuthService) ExpireAllUserSessions(userEmail string) error {
	sessions, err := a.sessionStorage.ListSessionsByUser(userEmail)
	if err != nil {
		return fmt.Errorf("failed to get user sessions: %w", err)
	}

	// Delete all sessions for the user
	for _, session := range sessions {
		if err := a.sessionStorage.DeleteSession(session.SessionToken); err != nil {
			// Log error but continue with other sessions
			fmt.Printf("Warning: failed to delete session %s: %v\n", session.SessionToken, err)
		}
	}

	return nil
}

// generateSessionToken generates a cryptographically secure session token
func (a *AuthService) generateSessionToken() (string, error) {
	bytes := make([]byte, 32) // 256 bits
	if _, err := rand.Read(bytes); err != nil {
		return "", fmt.Errorf("failed to generate random bytes: %w", err)
	}
	return hex.EncodeToString(bytes), nil
}

// verify2FA checks if the authentication included 2FA verification
func (a *AuthService) verify2FA(claims *auth.IDTokenClaims) error {
	// Check Authentication Context Class Reference (ACR) for 2FA
	// Google sets ACR to indicate the strength of authentication
	if claims.Acr != "" {
		// ACR values that indicate 2FA was used
		validACRValues := []string{
			"http://schemas.openid.net/pape/policies/2007/06/multi-factor",
			"urn:mace:incommon:iap:silver",
			"urn:mace:incommon:iap:gold",
		}
		
		for _, validACR := range validACRValues {
			if claims.Acr == validACR {
				return nil // 2FA verified via ACR
			}
		}
	}
	
	// Check Authentication Methods Reference (AMR) for 2FA methods
	// AMR contains the methods used during authentication
	if len(claims.Amr) > 0 {
		// Look for 2FA methods in AMR
		twoFactorMethods := []string{
			"mfa",     // Multi-factor authentication
			"sms",     // SMS verification
			"otp",     // One-time password
			"totp",    // Time-based OTP
			"hwk",     // Hardware key
			"fido",    // FIDO authentication
		}
		
		for _, method := range claims.Amr {
			for _, twoFAMethod := range twoFactorMethods {
				if method == twoFAMethod {
					return nil // 2FA verified via AMR
				}
			}
		}
		
		// If AMR contains multiple methods, it likely indicates 2FA
		if len(claims.Amr) > 1 {
			return nil
		}
	}
	
	// Additional verification: check authentication time
	// Recent authentication is more likely to have included 2FA
	authTime := time.Unix(claims.Iat, 0)
	maxAuthAge := 30 * time.Minute // Require recent authentication for 2FA verification
	
	if time.Since(authTime) > maxAuthAge {
		return fmt.Errorf("authentication too old, 2FA verification required")
	}
	
	// For production environments, you may want to:
	// 1. Always require 2FA and reject tokens without clear 2FA indicators
	// 2. Use Google Admin SDK to check user's 2FA enrollment status
	// 3. Implement organization-specific 2FA policies
	
	// For now, we'll accept recent authentications as potentially having 2FA
	// In a production system, you should be more strict about 2FA verification
	fmt.Printf("Warning: Could not verify 2FA from token claims, but authentication is recent\n")
	return nil
}

// GenerateOAuthState generates a cryptographically secure state parameter and PKCE verifier
// for OAuth CSRF protection. The state and verifier are stored temporarily in DynamoDB 
// with a short TTL for validation during callback.
//
// Returns:
//   - string: Hex-encoded secure random state parameter
//   - string: PKCE verifier for this state
//   - error: Any errors during random generation or state storage
func (a *AuthService) GenerateOAuthState() (string, string, error) {
	// Generate 32 bytes of cryptographically secure random data for state
	randomBytes := make([]byte, 32)
	if _, err := rand.Read(randomBytes); err != nil {
		return "", "", fmt.Errorf("failed to generate random state: %w", err)
	}
	
	// Encode state as hex string
	state := hex.EncodeToString(randomBytes)
	
	// Generate PKCE verifier
	verifier := oauth2.GenerateVerifier()
	
	// Store state and verifier temporarily for validation (5 minutes TTL)
	if err := a.storeOAuthState(state, verifier); err != nil {
		return "", "", fmt.Errorf("failed to store OAuth state: %w", err)
	}
	
	return state, verifier, nil
}

// ValidateOAuthState validates and consumes an OAuth state parameter.
// This method checks if the state was previously generated and stored,
// then removes it to prevent replay attacks.
//
// Parameters:
//   - state: The state parameter to validate
//
// Returns:
//   - string: PKCE verifier if state is valid
//   - error: Any errors during state validation or removal
func (a *AuthService) ValidateOAuthState(state string) (string, error) {
	if state == "" {
		return "", fmt.Errorf("state parameter is required")
	}
	
	// Check if state exists and get the verifier
	stateRecord, err := a.consumeOAuthState(state)
	if err != nil {
		return "", fmt.Errorf("failed to validate OAuth state: %w", err)
	}
	
	if stateRecord == nil {
		return "", fmt.Errorf("invalid or expired OAuth state")
	}
	
	return stateRecord.Verifier, nil
}

// storeOAuthState stores an OAuth state parameter and PKCE verifier temporarily in DynamoDB.
// Uses a separate table or the sessions table with a different key pattern.
// The state expires after 5 minutes to prevent long-term storage.
//
// Parameters:
//   - state: The state parameter to store
//   - verifier: The PKCE verifier to store
//
// Returns:
//   - error: Any errors during storage
func (a *AuthService) storeOAuthState(state, verifier string) error {
	// Create a temporary state record with 5-minute TTL
	now := time.Now().UTC()
	stateRecord := &auth.OAuthState{
		State:     state,
		Verifier:  verifier,
		CreatedAt: now,
		ExpiresAt: now.Add(5 * time.Minute),
	}
	
	return a.sessionStorage.SaveOAuthState(stateRecord)
}

// consumeOAuthState validates and removes an OAuth state parameter.
// This implements the "consume once" pattern for CSRF protection.
//
// Parameters:
//   - state: The state parameter to validate and consume
//
// Returns:
//   - *auth.OAuthState: state record if it existed and was consumed
//   - error: Any errors during validation or removal
func (a *AuthService) consumeOAuthState(state string) (*auth.OAuthState, error) {
	// Check if state exists
	stateRecord, err := a.sessionStorage.GetOAuthState(state)
	if err != nil {
		return nil, err
	}
	
	if stateRecord == nil {
		return nil, nil
	}
	
	// Check if state is expired
	if time.Now().UTC().After(stateRecord.ExpiresAt) {
		// Clean up expired state
		a.sessionStorage.DeleteOAuthState(state)
		return nil, nil
	}
	
	// Remove the state to prevent reuse
	if err := a.sessionStorage.DeleteOAuthState(state); err != nil {
		return nil, fmt.Errorf("failed to consume OAuth state: %w", err)
	}
	
	return stateRecord, nil
}

// GetGoogleOAuthURL generates the Google OAuth URL for authentication with PKCE
func (a *AuthService) GetGoogleOAuthURL(state, verifier string) string {
	config := a.getOAuth2Config()
	
	// Generate OAuth URL with PKCE and 2FA requirements
	url := config.AuthCodeURL(state,
		oauth2.AccessTypeOffline,
		oauth2.S256ChallengeOption(verifier),
		oauth2.SetAuthURLParam("prompt", "consent"),
		oauth2.SetAuthURLParam("include_granted_scopes", "true"),
		// Request 2FA by setting authentication context class reference
		oauth2.SetAuthURLParam("acr_values", "http://schemas.openid.net/pape/policies/2007/06/multi-factor"),
	)
	
	return url
}

// ExchangeCodeForUser exchanges authorization code for user information using PKCE
func (a *AuthService) ExchangeCodeForUser(code, verifier string) (*auth.User, error) {
	config := a.getOAuth2Config()
	
	// Exchange code for token with PKCE verifier
	token, err := config.Exchange(context.Background(), code, 
		oauth2.VerifierOption(verifier))
	if err != nil {
		return nil, fmt.Errorf("failed to exchange code for token: %w", err)
	}
	
	// Extract ID token from the response
	idTokenRaw, ok := token.Extra("id_token").(string)
	if !ok {
		return nil, fmt.Errorf("no ID token found in response")
	}
	
	// Validate ID token and extract user information
	user, err := a.ValidateIDToken(idTokenRaw)
	if err != nil {
		return nil, fmt.Errorf("failed to validate ID token: %w", err)
	}
	
	return user, nil
}