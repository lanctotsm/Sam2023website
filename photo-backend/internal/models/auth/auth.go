// Package auth contains models and types related to authentication and authorization domain.
// This includes user entities, session management, OAuth state, and authentication responses.
package auth

import "time"

// User represents an authenticated user in the system.
// Contains essential user information obtained from OAuth providers
// and used throughout the application for authorization decisions.
type User struct {
	Email         string `json:"email"`          // User's email address (primary identifier)
	Name          string `json:"name"`           // User's display name
	Picture       string `json:"picture"`        // URL to user's profile picture
	EmailVerified bool   `json:"email_verified"` // Whether email has been verified by OAuth provider
}

// Session represents an active user session stored in the system.
// Sessions provide stateful authentication and are stored in DynamoDB
// with automatic expiration via TTL.
type Session struct {
	SessionToken string    `json:"session_token" dynamodbav:"session_token"` // Unique session identifier
	UserEmail    string    `json:"user_email" dynamodbav:"user_email"`       // Email of authenticated user
	CreatedAt    time.Time `json:"created_at" dynamodbav:"created_at"`       // Session creation timestamp
	ExpiresAt    time.Time `json:"expires_at" dynamodbav:"expires_at"`       // Session expiration timestamp (TTL)
	LastActivity time.Time `json:"last_activity" dynamodbav:"last_activity"` // Last request timestamp
}

// OAuthState represents a temporary OAuth state parameter for CSRF protection.
// State parameters are generated during OAuth initiation and validated during callback
// to prevent cross-site request forgery attacks. Includes PKCE verifier for additional security.
type OAuthState struct {
	State     string    `json:"state" dynamodbav:"state"`           // Cryptographically secure random state
	Verifier  string    `json:"verifier" dynamodbav:"verifier"`     // PKCE code verifier
	CreatedAt time.Time `json:"created_at" dynamodbav:"created_at"` // State creation timestamp
	ExpiresAt time.Time `json:"expires_at" dynamodbav:"expires_at"` // State expiration timestamp (5 minutes)
}

// AuthRequest represents authentication-related requests from clients.
// Used for token-based authentication endpoints.
type AuthRequest struct {
	Token string `json:"token" validate:"required"` // OAuth token or session token
}

// AuthResponse represents the response structure for authentication operations.
// Provides authentication results and session information to clients.
type AuthResponse struct {
	Success      bool   `json:"success"`                    // Whether authentication was successful
	SessionToken string `json:"session_token,omitempty"`   // Session token for authenticated requests
	User         *User  `json:"user,omitempty"`            // User information (if authenticated)
	Message      string `json:"message,omitempty"`         // Human-readable status message
}

// AuthStatus represents the current authentication status for a user.
// Used by clients to determine authentication state and conditionally render UI.
type AuthStatus struct {
	Authenticated bool  `json:"authenticated"`       // Whether user is currently authenticated
	User          *User `json:"user,omitempty"`      // User information (if authenticated)
}

// SessionValidationResult represents the result of session validation operations.
// Used internally by authentication services to communicate validation outcomes.
type SessionValidationResult struct {
	Valid   bool     `json:"valid"`             // Whether session is valid and active
	Session *Session `json:"session,omitempty"` // Session information (if valid)
	User    *User    `json:"user,omitempty"`    // User information (if valid)
	Error   string   `json:"error,omitempty"`   // Error message (if invalid)
}

// IDTokenClaims represents the structure of Google ID token claims.
// Contains user data and token metadata from Google's ID token.
type IDTokenClaims struct {
	Aud           string   `json:"aud"`            // Audience (client ID)
	Sub           string   `json:"sub"`            // Subject (user ID)
	Email         string   `json:"email"`          // User's email address
	EmailVerified bool     `json:"email_verified"` // Email verification status
	Name          string   `json:"name"`           // User's full name
	Picture       string   `json:"picture"`        // Profile picture URL
	GivenName     string   `json:"given_name"`     // First name
	FamilyName    string   `json:"family_name"`    // Last name
	Locale        string   `json:"locale"`         // User's locale
	Iat           int64    `json:"iat"`            // Issued at timestamp
	Exp           int64    `json:"exp"`            // Expiration timestamp
	Amr           []string `json:"amr,omitempty"`  // Authentication Methods Reference (for 2FA)
	Acr           string   `json:"acr,omitempty"`  // Authentication Context Class Reference
}

// LoginRequest represents a login initiation request.
// Used to start the OAuth flow with optional parameters.
type LoginRequest struct {
	RedirectURL string `json:"redirect_url,omitempty"` // Optional custom redirect after login
	State       string `json:"state,omitempty"`        // Optional additional state data
}

// LoginResponse represents the response to a login initiation request.
// Contains the OAuth URL and state parameter for the client to use.
type LoginResponse struct {
	OAuthURL string `json:"oauth_url"` // Google OAuth authorization URL
	State    string `json:"state"`     // CSRF protection state parameter
}

// LogoutRequest represents a logout request from a client.
// May contain session information for proper cleanup.
type LogoutRequest struct {
	SessionToken string `json:"session_token,omitempty"` // Optional session token to invalidate
}

// LogoutResponse represents the response to a logout request.
// Confirms successful logout and provides any necessary cleanup information.
type LogoutResponse struct {
	Success bool   `json:"success"` // Whether logout was successful
	Message string `json:"message"` // Human-readable confirmation message
}

// SessionInfo represents detailed information about a user session.
// Used for session management and debugging purposes.
type SessionInfo struct {
	SessionToken string    `json:"session_token"` // Session identifier
	UserEmail    string    `json:"user_email"`    // Associated user email
	CreatedAt    time.Time `json:"created_at"`    // Creation timestamp
	ExpiresAt    time.Time `json:"expires_at"`    // Expiration timestamp
	LastActivity time.Time `json:"last_activity"` // Last activity timestamp
	IsActive     bool      `json:"is_active"`     // Whether session is currently active
	TimeToExpiry int64     `json:"time_to_expiry"` // Seconds until expiration
}