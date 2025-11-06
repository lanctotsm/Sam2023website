# Photo Management Backend

A serverless photo management system built with Go, AWS Lambda, DynamoDB, and S3. This backend automatically processes uploaded images, creates thumbnails, and stores metadata in a cost-optimized database.

## Features

- **Clean Architecture**: Organized with proper separation of concerns
- **Image Processing**: Automatic thumbnail and medium-size generation
- **Cost-Optimized Storage**: DynamoDB with pay-per-request billing
- **Organized S3 Structure**: Separate folders for originals, medium, and thumbnails
- **Comprehensive Testing**: Unit tests for all components
- **Error Handling**: Proper error handling and cleanup
- **RESTful API**: CRUD endpoints with proper HTTP status codes
- **CORS Support**: Ready for web frontend integration

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
└── internal/                  # Internal packages
    ├── config/                # Configuration management
    │   ├── config.go
    │   └── config_test.go
    ├── models/                # Data models
    │   └── photo.go
    ├── storage/               # Storage layer
    │   ├── s3.go             # S3 operations
    │   └── dynamodb.go       # DynamoDB operations
    ├── processor/             # Business logic
    │   ├── image.go          # Image processing
    │   └── image_test.go
    ├── service/               # Service layer
    │   └── photo.go          # Photo service
    └── handler/               # HTTP handlers
        └── handler.go        # Lambda handlers
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
                       │  (Metadata)     │            │
                       └─────────────────┘            │
                                                       │
                       ┌─────────────────┐            │
                       │      S3         │◀───────────┘
                       │   (Images)      │
                       └─────────────────┘
```

## API Endpoints

### POST /upload
Upload a new photo with metadata.

### GET /photos
List all photos with metadata.

### GET /photos/{id}
Get a specific photo by ID.

### DELETE /photos/{id}
Delete a photo and its associated files.

## Development

### Prerequisites
- Go 1.21+
- AWS CLI configured
- SAM CLI installed
- AWS account with appropriate permissions

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
# Run all tests
make test

# Run tests with coverage
make coverage

# Run specific package tests
go test -v ./internal/processor/
```

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
- `DYNAMODB_TABLE`: DynamoDB table name for metadata
- `AWS_REGION`: AWS region (defaults to us-east-1)
- `ENVIRONMENT`: Environment name (dev/staging/prod)

## Best Practices Implemented

1. **Clean Architecture**: Separation of concerns with distinct layers
2. **Dependency Injection**: Interfaces for testability
3. **Error Handling**: Proper error wrapping and context
4. **Configuration Management**: Environment-based configuration
5. **Testing**: Comprehensive unit tests
6. **Code Organization**: Logical package structure
7. **Resource Cleanup**: Proper cleanup on failures
8. **Validation**: Input validation and sanitization
9. **Logging**: Structured logging for debugging
10. **Performance**: Optimized image processing

## Cost Optimization

- **DynamoDB**: Pay-per-request billing
- **Lambda**: Only pay for execution time
- **S3**: Standard storage with lifecycle policies
- **No unnecessary features**: Minimal resource usage

## Security Considerations

For production:
1. Add authentication/authorization
2. Enable S3 bucket encryption
3. Add input validation and rate limiting
4. Use CloudFront for CDN
5. Implement virus scanning
6. Add WAF protection

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