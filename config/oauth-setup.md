# Google OAuth 2.0 Setup Guide

This document provides instructions for setting up Google OAuth 2.0 authentication for the photo backend system.

## Prerequisites

1. A Google Cloud Platform (GCP) project
2. Access to the Google Cloud Console
3. The photo backend API deployed and accessible

## Step 1: Create OAuth 2.0 Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth 2.0 Client IDs**
5. If prompted, configure the OAuth consent screen first

## Step 2: Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** user type (unless you have a Google Workspace)
3. Fill in the required information:
   - **App name**: Photo Backend
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
4. Add scopes:
   - `openid`
   - `email`
   - `profile`
5. Add test users if in testing mode:
   - `lanctotsm@gmail.com`

## Step 3: Create OAuth 2.0 Client ID

1. Return to **Credentials** and click **Create Credentials** > **OAuth 2.0 Client IDs**
2. Choose **Web application** as the application type
3. Set the name: "Photo Backend OAuth Client"
4. Add authorized redirect URIs:
   - `https://your-api-id.execute-api.region.amazonaws.com/prod/auth/callback`
   - If using custom domain: `https://api.yourdomain.com/auth/callback`
5. Click **Create**
6. Copy the **Client ID** and **Client Secret**

## Step 4: Update Configuration

1. Update your `config/secrets.json` file with the OAuth credentials:
   ```json
   {
     "GoogleOAuthClientId": "your-client-id.apps.googleusercontent.com",
     "GoogleOAuthClientSecret": "your-client-secret",
     "GoogleOAuthRedirectURL": "https://your-api-id.execute-api.region.amazonaws.com/prod/auth/callback",
     "AuthorizedUserEmail": "lanctotsm@gmail.com"
   }
   ```

2. Deploy the updated configuration using your deployment script

## Step 5: OAuth Scopes and Requirements

The application requests the following OAuth scopes:
- `openid`: Required for OpenID Connect
- `email`: Required to verify the user's email address
- `profile`: Required for basic profile information

## Step 6: 2FA Verification

The system requires 2-factor authentication (2FA) to be enabled on the Google account. The OAuth flow will verify that 2FA was used during authentication by checking the `amr` (Authentication Methods References) claim in the ID token.

## Security Considerations

1. **Client Secret Security**: Store the client secret securely and never commit it to version control
2. **Redirect URI Validation**: Ensure redirect URIs are exactly as configured in Google Cloud Console
3. **HTTPS Only**: All OAuth flows must use HTTPS in production
4. **Token Validation**: Always validate ID tokens server-side
5. **Session Management**: Implement secure session management with proper expiration

## Testing the OAuth Flow

1. Deploy the application with OAuth configuration
2. Navigate to `/auth/login` endpoint
3. Complete the Google OAuth flow with 2FA
4. Verify successful authentication and session creation
5. Test protected endpoints with the session token

## Troubleshooting

### Common Issues

1. **Invalid Redirect URI**: Ensure the redirect URI in your request exactly matches the one configured in Google Cloud Console
2. **Client ID Mismatch**: Verify the client ID is correctly set in environment variables
3. **2FA Not Detected**: Ensure the Google account has 2FA enabled and was used during login
4. **CORS Issues**: Configure CORS settings in API Gateway to allow your frontend domain

### Error Codes

- `invalid_client`: Client ID or secret is incorrect
- `redirect_uri_mismatch`: Redirect URI doesn't match configuration
- `access_denied`: User denied authorization or 2FA requirement not met
- `invalid_grant`: Authorization code is invalid or expired

## Environment Variables

The following environment variables are required:

- `GOOGLE_OAUTH_CLIENT_ID`: OAuth 2.0 Client ID
- `GOOGLE_OAUTH_CLIENT_SECRET`: OAuth 2.0 Client Secret  
- `GOOGLE_OAUTH_REDIRECT_URL`: Authorized redirect URI
- `AUTHORIZED_USER_EMAIL`: Email of the authorized user (lanctotsm@gmail.com)