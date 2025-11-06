# Photo Backend Authentication Deployment Guide

This guide covers deploying the photo backend with Google OAuth 2FA authentication and album management features.

## Prerequisites

1. **AWS CLI** - Configured with appropriate permissions
2. **SAM CLI** - For serverless application deployment
3. **Go 1.21+** - For building the Lambda function
4. **Google Cloud Platform Account** - For OAuth configuration
5. **PowerShell** - For running deployment scripts (Windows)

## Quick Start

1. **Configure Google OAuth** (see detailed steps below)
2. **Create secrets file**:
   ```powershell
   Copy-Item config/secrets.example.json config/secrets.json
   # Edit config/secrets.json with your OAuth credentials
   ```
3. **Deploy everything**:
   ```powershell
   .\scripts\deploy-with-auth.ps1 -StackName "photo-backend"
   ```

## Detailed Setup

### Step 1: Google OAuth Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable the Google+ API
4. Configure OAuth consent screen:
   - App name: "Photo Backend"
   - Authorized domains: Your API domain
   - Scopes: `openid`, `email`, `profile`
   - Test users: `lanctotsm@gmail.com`

5. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized redirect URIs: `https://your-api-id.execute-api.region.amazonaws.com/prod/auth/callback`

6. Copy Client ID and Client Secret

### Step 2: Configure Secrets

Create `config/secrets.json` based on the example:

```json
{
  "GoogleOAuthClientId": "your-client-id.apps.googleusercontent.com",
  "GoogleOAuthClientSecret": "your-client-secret",
  "GoogleOAuthRedirectURL": "https://your-api-id.execute-api.region.amazonaws.com/prod/auth/callback",
  "AuthorizedUserEmail": "lanctotsm@gmail.com",
  "SessionTimeoutHours": 24,
  "NotificationEmail": "admin@yourdomain.com"
}
```

### Step 3: Deploy

#### Option A: Complete Deployment (Recommended)
```powershell
.\scripts\deploy-with-auth.ps1 -StackName "photo-backend" -Region "us-east-1"
```

#### Option B: Manual Step-by-Step
```powershell
# 1. Build and deploy
cd photo-backend
sam deploy --stack-name photo-backend --capabilities CAPABILITY_IAM --parameter-overrides GoogleOAuthClientId=your-id GoogleOAuthClientSecret=your-secret

# 2. Initialize database
.\scripts\initialize-database.ps1 -StackName "photo-backend"

# 3. Migrate existing photos (if any)
.\scripts\migrate-existing-photos.ps1 -StackName "photo-backend" -UserEmail "your-email@example.com"

# 4. Validate deployment
.\scripts\validate-deployment.ps1 -StackName "photo-backend"
```

## Script Reference

### deploy-with-auth.ps1
Complete deployment script that handles everything:
- **Parameters**:
  - `-StackName` (required): CloudFormation stack name
  - `-Region`: AWS region (default: us-east-1)
  - `-SecretsFile`: Path to secrets file (default: config/secrets.json)
  - `-SkipMigration`: Skip photo migration
  - `-ValidateOnly`: Only validate configuration

### initialize-database.ps1
Initializes DynamoDB tables and verifies configuration:
- Checks table status and GSIs
- Verifies TTL configuration
- Tests basic read/write operations

### migrate-existing-photos.ps1
Migrates existing photos to include album associations:
- **Parameters**:
  - `-StackName` (required): CloudFormation stack name
  - `-UserEmail` (required): User email for photo ownership
  - `-Region`: AWS region (default: us-east-1)
  - `-DefaultAlbumName`: Album name (default: "Default Album")
- Creates a default album
- Updates existing photos with album_id and user_email
- Updates album photo count

### validate-deployment.ps1
Validates the deployment:
- Tests API endpoints
- Checks CloudFormation resources
- Verifies environment variables
- Provides next steps

## Architecture Changes

### New DynamoDB Tables

1. **Sessions Table**
   - Primary Key: `session_token`
   - GSI: `user_email-created_at-index`
   - TTL: `expires_at`

2. **Albums Table**
   - Primary Key: `album_id`
   - GSI: `user_email-created_at-index`

3. **Photos Table** (Enhanced)
   - Added fields: `album_id`, `user_email`
   - New GSI: `album_id-uploaded_at-index`
   - New GSI: `user_email-uploaded_at-index`

### New API Endpoints

#### Authentication
- `POST /auth/login` - Initiate OAuth flow
- `GET /auth/callback` - OAuth callback handler
- `POST /auth/logout` - End session
- `GET /auth/status` - Check authentication status

#### Albums
- `POST /albums` - Create album
- `GET /albums` - List albums
- `GET /albums/{id}` - Get album details
- `PUT /albums/{id}/thumbnail` - Set album thumbnail
- `DELETE /albums/{id}` - Delete album

#### Photos (Enhanced)
- `POST /albums/{id}/photos` - Upload photo to album
- `GET /albums/{id}/photos` - List photos in album
- All photo endpoints now require authentication

## Environment Variables

The following environment variables are configured automatically:

- `GOOGLE_OAUTH_CLIENT_ID` - OAuth client ID
- `GOOGLE_OAUTH_CLIENT_SECRET` - OAuth client secret
- `GOOGLE_OAUTH_REDIRECT_URL` - OAuth redirect URL
- `AUTHORIZED_USER_EMAIL` - Authorized user email
- `SESSION_TIMEOUT_HOURS` - Session timeout (default: 24)
- `SESSIONS_TABLE` - Sessions DynamoDB table name
- `ALBUMS_TABLE` - Albums DynamoDB table name

## Security Features

1. **Google OAuth 2FA** - Requires 2-factor authentication
2. **Single User Access** - Only `lanctotsm@gmail.com` can authenticate
3. **Session Management** - Secure session tokens with TTL
4. **Protected Endpoints** - All upload/delete operations require authentication
5. **HTTPS Only** - All OAuth flows use HTTPS

## Troubleshooting

### Common Issues

1. **OAuth Redirect URI Mismatch**
   - Ensure the redirect URI in Google Console exactly matches your API endpoint
   - Format: `https://api-id.execute-api.region.amazonaws.com/prod/auth/callback`

2. **2FA Not Detected**
   - Ensure the Google account has 2FA enabled
   - The system checks the `amr` claim in the ID token

3. **Session Expired**
   - Sessions expire after 24 hours by default
   - Users need to re-authenticate through `/auth/login`

4. **Table Not Found**
   - Run the database initialization script
   - Check CloudFormation stack status

### Logs and Monitoring

- **Lambda Logs**: CloudWatch `/aws/lambda/photo-processor-{env}`
- **API Gateway Logs**: CloudWatch `/aws/apigateway/{stack-name}-{env}`
- **DynamoDB Metrics**: CloudWatch DynamoDB section

### Testing

1. **Test OAuth Flow**:
   ```
   Visit: https://your-api-endpoint/auth/login
   Complete Google OAuth with 2FA
   Verify redirect to home page
   ```

2. **Test Protected Endpoints**:
   ```powershell
   # Should return 401 without authentication
   curl https://your-api-endpoint/albums
   
   # Should work after authentication
   curl -H "Authorization: Bearer your-session-token" https://your-api-endpoint/albums
   ```

## Migration from Previous Version

If you have an existing photo backend without authentication:

1. **Backup Data**: Export existing photos metadata
2. **Deploy New Version**: Use the deployment script
3. **Run Migration**: The script automatically migrates existing photos
4. **Update Frontend**: Modify frontend to use authentication endpoints
5. **Test Thoroughly**: Verify all functionality works

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review CloudWatch logs for errors
3. Validate your Google OAuth configuration
4. Ensure all required secrets are properly configured