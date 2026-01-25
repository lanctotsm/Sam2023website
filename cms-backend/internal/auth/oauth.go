package auth

import (
	"context"
	"fmt"

	"cms-backend/internal/config"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/idtoken"
)

type OAuthClient struct {
	Config *oauth2.Config
}

type GoogleClaims struct {
	GoogleID string
	Email    string
	Name     string
}

func NewOAuthClient(cfg config.Config) *OAuthClient {
	return &OAuthClient{
		Config: &oauth2.Config{
			ClientID:     cfg.GoogleClientID,
			ClientSecret: cfg.GoogleClientSecret,
			RedirectURL:  cfg.GoogleRedirectURL,
			Scopes:       []string{"openid", "email", "profile"},
			Endpoint:     google.Endpoint,
		},
	}
}

func (c *OAuthClient) Exchange(ctx context.Context, code string) (*oauth2.Token, error) {
	return c.Config.Exchange(ctx, code)
}

func (c *OAuthClient) VerifyIDToken(ctx context.Context, idToken string) (*GoogleClaims, error) {
	payload, err := idtoken.Validate(ctx, idToken, c.Config.ClientID)
	if err != nil {
		return nil, fmt.Errorf("id token validation failed: %w", err)
	}

	email, _ := payload.Claims["email"].(string)
	sub, _ := payload.Claims["sub"].(string)
	name, _ := payload.Claims["name"].(string)

	if email == "" || sub == "" {
		return nil, fmt.Errorf("missing required claims in id token")
	}

	return &GoogleClaims{
		GoogleID: sub,
		Email:    email,
		Name:     name,
	}, nil
}
