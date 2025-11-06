package handler

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"github.com/aws/aws-lambda-go/events"

	"photo-backend/internal/models/auth"
	"photo-backend/internal/service"
)

// AuthLoginHandler initiates OAuth authentication flow.
type AuthLoginHandler struct {
	*Handler
}

// Handle processes login initiation requests by generating OAuth URL and state.
func (h *AuthLoginHandler) Handle(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	state, verifier, err := h.authService.GenerateOAuthState()
	if err != nil {
		return h.responseBuilder.Error(http.StatusInternalServerError, "failed to generate OAuth state"), nil
	}
	
	oauthURL := h.authService.GetGoogleOAuthURL(state, verifier)
	
	response := map[string]string{
		"oauth_url": oauthURL,
		"state":     state,
	}
	
	return h.responseBuilder.Success(response), nil
}

// AuthCallbackHandler completes OAuth authentication flow.
type AuthCallbackHandler struct {
	*Handler
}

// Handle processes OAuth callback from Google with CSRF protection and session creation.
func (h *AuthCallbackHandler) Handle(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	state := request.QueryStringParameters["state"]
	if state == "" {
		return h.responseBuilder.Error(http.StatusBadRequest, "OAuth state parameter is required"), nil
	}
	
	verifier, err := h.authService.ValidateOAuthState(state)
	if err != nil {
		return h.responseBuilder.Error(http.StatusBadRequest, fmt.Errorf("validating OAuth state: %w", err).Error()), nil
	}
	
	code := request.QueryStringParameters["code"]
	if code == "" {
		return h.responseBuilder.Error(http.StatusBadRequest, "authorization code is required"), nil
	}
	
	user, err := h.authService.ExchangeCodeForUser(code, verifier)
	if err != nil {
		errorMsg := h.mapAuthErrorMessage(err)
		return h.responseBuilder.Error(http.StatusUnauthorized, errorMsg), nil
	}
	
	session, err := h.authService.CreateSession(user.Email)
	if err != nil {
		return h.responseBuilder.Error(http.StatusInternalServerError, fmt.Errorf("creating session: %w", err).Error()), nil
	}
	
	cookieHeader := fmt.Sprintf("session=%s; HttpOnly; Secure; SameSite=Strict; Max-Age=86400", session.SessionToken)
	additionalHeaders := service.HTTPHeaders{"Set-Cookie": cookieHeader}
	
	return h.responseBuilder.Redirect("/", additionalHeaders), nil
}

// AuthLogoutHandler terminates user sessions securely.
type AuthLogoutHandler struct {
	*Handler
}

// Handle processes logout requests with idempotent session cleanup.
func (h *AuthLogoutHandler) Handle(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	sessionToken := h.sessionExtractor.ExtractToken(request)
	if sessionToken != "" {
		h.authService.ExpireSession(sessionToken)
	}
	
	additionalHeaders := service.HTTPHeaders{"Set-Cookie": "session=; HttpOnly; Secure; SameSite=Strict; Max-Age=0"}
	response := map[string]string{"message": "logged out successfully"}
	
	return h.responseBuilder.SuccessWithHeaders(response, additionalHeaders), nil
}

// AuthStatusHandler checks current authentication state.
type AuthStatusHandler struct {
	*Handler
}

// Handle returns authentication status without triggering auth flows.
func (h *AuthStatusHandler) Handle(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	sessionToken := h.sessionExtractor.ExtractToken(request)
	if sessionToken == "" {
		return h.responseBuilder.Success(auth.AuthStatus{Authenticated: false}), nil
	}
	
	result, err := h.authService.ValidateSession(sessionToken)
	if err != nil || !result.Valid {
		return h.responseBuilder.Success(auth.AuthStatus{Authenticated: false}), nil
	}
	
	return h.responseBuilder.Success(auth.AuthStatus{
		Authenticated: true,
		User:          result.User,
	}), nil
}

// mapAuthErrorMessage converts authentication errors to user-friendly messages.
func (h *Handler) mapAuthErrorMessage(err error) string {
	errMsg := err.Error()
	switch {
	case contains(errMsg, "2FA", "two-factor"):
		return "Two-factor authentication is required"
	case contains(errMsg, "invalid token"):
		return "Invalid authentication token"
	case contains(errMsg, "expired"):
		return "Authentication token has expired"
	default:
		return "Authentication failed"
	}
}

// contains checks if any of the substrings exist in the main string.
func contains(s string, substrings ...string) bool {
	for _, substr := range substrings {
		if strings.Contains(s, substr) {
			return true
		}
	}
	return false
}