# Photo Management Backend

A serverless photo management system built with Go, AWS Lambda, DynamoDB, and S3. The system provides secure photo and album management with Google OAuth2 authentication.

## Core Functionality

- **Authentication**: Google OAuth2 with PKCE and 2FA support
- **Photo Management**: Upload, list, view, and delete photos
- **Album Organization**: Create and manage photo albums with thumbnails
- **Image Processing**: Automatic thumbnail and medium-size generation
- **Session Management**: Secure session handling with DynamoDB storage
- **RESTful API**: HTTP endpoints with proper status codes and CORS support

## Project Structure

```
photo-backend/
├── main.go                    # Application entry point
├── go.mod                     # Go module definition
├── template.yaml              # SAM CloudFormation template
├── Makefile                   # Build and deployment commands
├── Dockerfile                 # Container definition
├── deploy.sh                  # Deployment script
├── README.md                  # This file
├── features/                  # BDD test specifications
│   ├── *.feature            # Gherkin feature files
│   └── steps_test.go        # Test step implementations
└── internal/                  # Internal packages
    ├── config/                # Configuration management
    │   ├── config.go
    │   └── config_test.go
    ├── models/                # Data models
    │   ├── album/            # Album domain models
    │   ├── auth/             # Authentication models
    │   ├── common/           # Shared models
    │   └── photo/            # Photo domain models
    ├── storage/               # Storage layer
    │   ├── album.go          # Album storage operations
    │   ├── photo.go          # Photo storage operations
    │   ├── session.go        # Session storage operations
    │   └── s3.go             # S3 operations
    ├── processor/             # Business logic
    │   ├── image.go          # Image processing
    │   └── image_test.go
    ├── service/               # Service layer
    │   ├── album.go          # Album business logic
    │   ├── auth.go           # Authentication service
    │   ├── photo.go          # Photo business logic
    │   └── validation.go     # Request validation
    ├── middleware/            # HTTP middleware
    │   └── auth.go           # Authentication middleware
    └── handler/               # HTTP handlers
        ├── handler.go        # Core handler and routing
        ├── auth.go           # Authentication endpoints
        ├── photo.go          # Photo management endpoints
        └── album.go          # Album management endpoints
```

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │───▶│  API Gateway    │───▶│  Lambda         │
│  (Next.js)      │    │                 │    │  (Go)           │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                       ┌─────────────────┐            │
                       │   DynamoDB      │◀───────────┤
                       │ Photos/Albums/  │            │
                       │   Sessions      │            │
                       └─────────────────┘            │
                                                       │
                       ┌─────────────────┐            │
                       │      S3         │◀───────────┤
                       │   (Images)      │            │
                       └─────────────────┘            │
                                                       │
                       ┌─────────────────┐            │
                       │  Google OAuth   │◀───────────┘
                       │                 │
                       └─────────────────┘
```

## API Endpoints

### Authentication
- `POST /auth/login` - Initiate Google OAuth login
- `GET /auth/callback` - Handle OAuth callback
- `POST /auth/logout` - End user session
- `GET /auth/status` - Check authentication status

### Photos
- `POST /upload` - Upload a new photo to an album
- `GET /photos` - List all photos with metadata
- `GET /photos/{id}` - Get a specific photo by ID
- `DELETE /photos/{id}` - Delete a photo and its files

### Albums
- `POST /albums` - Create a new album
- `GET /albums` - List all albums with thumbnails
- `PUT /albums/{id}/thumbnail` - Set album thumbnail
- `DELETE /albums/{id}` - Delete an album
- `GET /albums/{id}/photos` - List photos in an album

## Development

### Prerequisites
- Go 1.21+
- AWS CLI configured
- SAM CLI installed
- AWS account with appropriate permissions
- Google Cloud Console project with OAuth2 credentials

### Google OAuth Setup
1. Create a project in Google Cloud Console
2. Enable the Google+ API
3. Create OAuth2 credentials (Web application)
4. Add authorized redirect URIs
5. Set environment variables:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URL`
   - `AUTHORIZED_EMAIL`

### Local Development
```bash
# Install dependencies
go mod tidy

# Run tests
make test

# Check code quality
make check

# Build for Lambda
make build

# Run locally
make local
```

### Testing
```bash
# Run all tests (unit + integration + BDD)
make test

# Run tests with coverage
make coverage

# Run specific package tests
go test -v ./internal/processor/

# Run BDD feature tests
go test -v ./features/

# Run specific test suites
go test -v ./internal/service/
go test -v ./internal/storage/
```

The project includes:
- Unit tests for all service layers
- Integration tests for end-to-end workflows
- BDD tests using Gherkin feature files
- Mock implementations for external dependencies

### Code Quality
```bash
# Format code
make fmt

# Vet code
make vet

# Lint code (requires golangci-lint)
make lint
```

## Deployment

### Quick Deploy
```bash
chmod +x deploy.sh
./deploy.sh [stack-name] [environment] [region]
```

### Manual Deploy
```bash
# Build and deploy
make deploy STACK_NAME=my-photos ENVIRONMENT=prod

# View logs
make logs
```

### Docker Deployment
```bash
# Build Docker image
make docker-build

# Run with Docker
make docker-run
```

## Configuration

Environment variables (set automatically by CloudFormation):
- `S3_BUCKET`: S3 bucket name for photo storage
- `DYNAMODB_TABLE`: DynamoDB table name for photo metadata
- `ALBUMS_TABLE`: DynamoDB table name for album data
- `SESSIONS_TABLE`: DynamoDB table name for user sessions
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `GOOGLE_REDIRECT_URL`: OAuth callback URL
- `AUTHORIZED_EMAIL`: Email address authorized to use the system
- `AWS_REGION`: AWS region (defaults to us-east-1)
- `ENVIRONMENT`: Environment name (dev/staging/prod)

## Technical Details

### Authentication
- Google OAuth2 with PKCE (Proof Key for Code Exchange)
- 2FA verification through authentication context
- Session-based authentication with DynamoDB storage
- CSRF protection with state parameters

### Security
- OAuth2 state validation prevents CSRF attacks
- Session tokens with automatic expiration
- Middleware-based authentication for protected endpoints
- Input validation and sanitization

### Architecture Patterns
- Clean architecture with separation of concerns
- Dependency injection for testability
- Domain-driven design with separate models
- Handler organization by functional domain

## Cost Optimization

- **DynamoDB**: Pay-per-request billing
- **Lambda**: Only pay for execution time
- **S3**: Standard storage with lifecycle policies
- **No unnecessary features**: Minimal resource usage

## Security Considerations

Current security measures:
- Google OAuth2 authentication with 2FA support
- Session-based authorization
- CSRF protection with OAuth state validation
- Input validation and sanitization

Additional considerations for production:
- Enable S3 bucket encryption
- Add rate limiting
- Use CloudFront for CDN
- Implement virus scanning
- Add WAF protection
- Enable CloudTrail logging

## Monitoring

```bash
# View Lambda logs
make logs

# Monitor with CloudWatch
aws logs tail /aws/lambda/photo-processor --follow
```

## Cleanup

```bash
aws cloudformation delete-stack --stack-name photo-backend
```