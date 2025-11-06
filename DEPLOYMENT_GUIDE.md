# CloudFormation Deployment Guide for Photo Management System

This guide provides step-by-step instructions for deploying the photo management system using AWS CloudFormation and SAM (Serverless Application Model).

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [AWS Setup](#aws-setup)
3. [Configuration](#configuration)
4. [Deployment Options](#deployment-options)
5. [Infrastructure Overview](#infrastructure-overview)
6. [Security Configuration](#security-configuration)
7. [Monitoring and Logging](#monitoring-and-logging)
8. [Troubleshooting](#troubleshooting)
9. [Cost Optimization](#cost-optimization)
10. [Cleanup](#cleanup)

## Prerequisites

### Required Tools

#### Windows Installation

1. **AWS CLI v2**
   ```powershell
   # Download and install AWS CLI for Windows
   # Visit: https://aws.amazon.com/cli/
   # Or use Chocolatey
   choco install awscli
   
   # Verify installation
   aws --version
   ```

2. **SAM CLI**
   ```powershell
   # Install SAM CLI using pip
   pip install aws-sam-cli
   
   # Or use Chocolatey
   choco install aws-sam-cli
   
   # Verify installation
   sam --version
   ```

3. **Go 1.21+**
   ```powershell
   # Download from https://golang.org/dl/
   # Or use Chocolatey
   choco install golang
   
   # Verify installation
   go version
   ```

4. **PowerShell 5.1+** (Usually pre-installed on Windows 10/11)
   ```powershell
   # Check PowerShell version
   $PSVersionTable.PSVersion
   ```

5. **Docker Desktop** (for local testing)
   ```powershell
   # Download from https://www.docker.com/products/docker-desktop
   # Or use Chocolatey
   choco install docker-desktop
   ```

#### Linux/Mac Installation

1. **AWS CLI v2**
   ```bash
   # Linux
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install
   
   # macOS
   curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
   sudo installer -pkg AWSCLIV2.pkg -target /
   
   # Verify installation
   aws --version
   ```

2. **SAM CLI**
   ```bash
   # Install SAM CLI
   pip install aws-sam-cli
   
   # Verify installation
   sam --version
   ```

3. **Go 1.21+**
   ```bash
   # Download and install Go
   wget https://go.dev/dl/go1.21.0.linux-amd64.tar.gz
   sudo tar -C /usr/local -xzf go1.21.0.linux-amd64.tar.gz
   export PATH=$PATH:/usr/local/go/bin
   ```

4. **Docker** (for local testing)
   ```bash
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   ```

### AWS Account Requirements

- AWS Account with appropriate permissions
- IAM user with programmatic access
- Sufficient service limits for:
  - Lambda functions
  - DynamoDB tables
  - S3 buckets
  - API Gateway APIs

## AWS Setup

### 1. Configure AWS Credentials

#### Windows (PowerShell)
```powershell
# Configure AWS CLI
aws configure

# Or use environment variables
$env:AWS_ACCESS_KEY_ID="your_access_key"
$env:AWS_SECRET_ACCESS_KEY="your_secret_key"
$env:AWS_DEFAULT_REGION="us-east-1"
```

#### Linux/Mac (Bash)
```bash
# Configure AWS CLI
aws configure

# Or use environment variables
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_DEFAULT_REGION=us-east-1
```

### 2. Verify AWS Access

```powershell
# Test AWS connectivity (works on all platforms)
aws sts get-caller-identity

# List available regions
aws ec2 describe-regions --output table
```

### 3. Create IAM Role for Deployment (Optional)

```bash
# Create deployment role with necessary permissions
aws iam create-role \
  --role-name PhotoBackendDeploymentRole \
  --assume-role-policy-document file://deployment-trust-policy.json

# Attach necessary policies
aws iam attach-role-policy \
  --role-name PhotoBackendDeploymentRole \
  --policy-arn arn:aws:iam::aws:policy/PowerUserAccess
```

## Configuration

### 1. Environment Configuration

Create environment-specific parameter files:

```bash
# Create parameters directory
mkdir -p config/environments
```

**config/environments/dev.json**
```json
{
  "Parameters": {
    "Environment": "dev",
    "EnableLogging": "true",
    "EnableXRay": "false",
    "CorsOrigin": "*",
    "ImageMaxSize": "10485760",
    "ThumbnailSize": "200",
    "MediumSize": "800"
  }
}
```

**config/environments/prod.json**
```json
{
  "Parameters": {
    "Environment": "prod",
    "EnableLogging": "true",
    "EnableXRay": "true",
    "CorsOrigin": "https://yourdomain.com",
    "ImageMaxSize": "10485760",
    "ThumbnailSize": "200",
    "MediumSize": "800"
  }
}
```

### 2. Secrets Management

Create a secrets configuration file (will be added to .gitignore):

**config/secrets.json** (DO NOT COMMIT)
```json
{
  "dev": {
    "DatabaseEncryptionKey": "your-dev-encryption-key",
    "S3KMSKeyId": "alias/aws/s3",
    "NotificationEmail": "dev@yourdomain.com"
  },
  "prod": {
    "DatabaseEncryptionKey": "your-prod-encryption-key",
    "S3KMSKeyId": "arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012",
    "NotificationEmail": "admin@yourdomain.com"
  }
}
```

## Deployment Options

### Option 1: Quick Deployment (Recommended for Development)

#### Windows (PowerShell)
```powershell
# Clone the repository
git clone <your-repo-url>
Set-Location photo-backend

# Setup AWS configuration (first time only)
.\scripts\setup-aws-config.ps1

# Deploy to development environment
.\deploy-with-secrets.ps1 -StackName photo-backend-dev -Environment dev -Region us-east-1

# Deploy to production environment
.\deploy-with-secrets.ps1 -StackName photo-backend-prod -Environment prod -Region us-east-1
```

#### Linux/Mac (Bash)
```bash
# Clone the repository
git clone <your-repo-url>
cd photo-backend

# Make scripts executable
chmod +x scripts/setup-aws-config.sh
chmod +x deploy-with-secrets.sh

# Setup AWS configuration (first time only)
./scripts/setup-aws-config.sh

# Deploy to development environment
./deploy-with-secrets.sh photo-backend-dev dev us-east-1

# Deploy to production environment
./deploy-with-secrets.sh photo-backend-prod prod us-east-1
```

### Option 2: Manual SAM Deployment

```bash
# Build the application
make build

# Deploy with SAM
sam deploy \
  --template-file template.yaml \
  --stack-name photo-backend-dev \
  --parameter-overrides file://config/environments/dev.json \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --region us-east-1 \
  --confirm-changeset

# For production with additional security
sam deploy \
  --template-file template.yaml \
  --stack-name photo-backend-prod \
  --parameter-overrides file://config/environments/prod.json \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --region us-east-1 \
  --confirm-changeset \
  --no-fail-on-empty-changeset
```

### Option 3: CI/CD Pipeline Deployment

```bash
# Using AWS CodePipeline (see CI/CD section below)
aws cloudformation create-stack \
  --stack-name photo-backend-pipeline \
  --template-body file://pipeline-template.yaml \
  --parameters ParameterKey=GitHubRepo,ParameterValue=your-repo \
  --capabilities CAPABILITY_IAM
```

## Infrastructure Overview

### Resources Created

1. **Lambda Function**
   - Runtime: Go 1.x
   - Memory: 512 MB (configurable)
   - Timeout: 30 seconds
   - Environment variables for S3 and DynamoDB

2. **API Gateway**
   - REST API with CORS enabled
   - Custom domain support (optional)
   - Request/response logging
   - Throttling and caching

3. **DynamoDB Table**
   - Pay-per-request billing mode
   - Point-in-time recovery (optional)
   - Encryption at rest (optional)
   - Global secondary indexes (if needed)

4. **S3 Bucket**
   - Versioning enabled
   - Public read access for images
   - Lifecycle policies for cost optimization
   - CORS configuration

5. **IAM Roles and Policies**
   - Lambda execution role
   - Least privilege access
   - Resource-specific permissions

6. **CloudWatch Resources**
   - Log groups for Lambda
   - Custom metrics and alarms
   - Dashboard (optional)

### Network Architecture

```
Internet
    │
    ▼
┌─────────────────┐
│   CloudFront    │ (Optional CDN)
│   Distribution  │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│   API Gateway   │
│   REST API      │
└─────────────────┘
    │
    ▼
┌─────────────────┐    ┌─────────────────┐
│   Lambda        │───▶│   DynamoDB      │
│   Function      │    │   Table         │
└─────────────────┘    └─────────────────┘
    │
    ▼
┌─────────────────┐
│   S3 Bucket     │
│   (Images)      │
└─────────────────┘
```

## Security Configuration

### 1. IAM Policies

**Lambda Execution Policy**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::photo-bucket-name/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Scan",
        "dynamodb:Query"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/photo-metadata-table"
    }
  ]
}
```

### 2. S3 Bucket Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::photo-bucket-name/photos/*"
    }
  ]
}
```

### 3. API Gateway Security

- Enable AWS WAF (Web Application Firewall)
- Configure API keys for rate limiting
- Enable request/response logging
- Set up custom authorizers (if needed)

## Monitoring and Logging

### 1. CloudWatch Logs

```bash
# View Lambda logs
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/photo"

# Tail logs in real-time
sam logs -n PhotoProcessorFunction --stack-name photo-backend-dev --tail
```

### 2. CloudWatch Metrics

Key metrics to monitor:
- Lambda invocations and errors
- API Gateway 4xx/5xx errors
- DynamoDB read/write capacity
- S3 request metrics

### 3. CloudWatch Alarms

```bash
# Create alarm for Lambda errors
aws cloudwatch put-metric-alarm \
  --alarm-name "PhotoBackend-LambdaErrors" \
  --alarm-description "Lambda function errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=FunctionName,Value=photo-processor-function
```

### 4. X-Ray Tracing (Optional)

Enable X-Ray for distributed tracing:
```yaml
# In template.yaml
Tracing: Active
Environment:
  Variables:
    _X_AMZN_TRACE_ID: !Ref AWS::NoValue
```

## Troubleshooting

### Common Issues

1. **Deployment Failures**
   ```bash
   # Check CloudFormation events
   aws cloudformation describe-stack-events --stack-name photo-backend-dev
   
   # Validate template
   sam validate --template template.yaml
   ```

2. **Lambda Function Errors**
   ```bash
   # Check function logs
   aws logs filter-log-events \
     --log-group-name "/aws/lambda/photo-processor" \
     --start-time $(date -d '1 hour ago' +%s)000
   ```

3. **API Gateway Issues**
   ```bash
   # Test API endpoint
   curl -X GET https://api-id.execute-api.region.amazonaws.com/dev/photos
   
   # Check API Gateway logs
   aws logs filter-log-events \
     --log-group-name "API-Gateway-Execution-Logs_api-id/dev"
   ```

4. **S3 Access Issues**
   ```bash
   # Check bucket policy
   aws s3api get-bucket-policy --bucket photo-bucket-name
   
   # Test public access
   curl -I https://photo-bucket-name.s3.amazonaws.com/photos/test.jpg
   ```

### Debug Mode

Enable debug logging:
```bash
export SAM_CLI_DEBUG=1
sam deploy --debug
```

## Cost Optimization

### 1. DynamoDB Optimization

- Use on-demand billing for variable workloads
- Enable auto-scaling for predictable workloads
- Implement TTL for temporary data

### 2. Lambda Optimization

- Right-size memory allocation
- Use provisioned concurrency for consistent performance
- Implement connection pooling

### 3. S3 Optimization

- Use S3 Intelligent Tiering
- Implement lifecycle policies
- Enable S3 Transfer Acceleration (if needed)

### 4. API Gateway Optimization

- Enable caching for GET requests
- Use regional endpoints instead of edge-optimized

### Cost Monitoring

```bash
# Set up billing alerts
aws budgets create-budget \
  --account-id 123456789012 \
  --budget file://budget-config.json \
  --notifications-with-subscribers file://budget-notifications.json
```

## Cleanup

### Remove All Resources

```bash
# Delete CloudFormation stack
aws cloudformation delete-stack --stack-name photo-backend-dev

# Wait for deletion to complete
aws cloudformation wait stack-delete-complete --stack-name photo-backend-dev

# Verify deletion
aws cloudformation describe-stacks --stack-name photo-backend-dev
```

### Manual Cleanup (if needed)

```bash
# Empty and delete S3 bucket
aws s3 rm s3://photo-bucket-name --recursive
aws s3 rb s3://photo-bucket-name

# Delete CloudWatch log groups
aws logs delete-log-group --log-group-name "/aws/lambda/photo-processor"
```

## Next Steps

1. Set up CI/CD pipeline
2. Configure custom domain
3. Implement authentication
4. Add monitoring dashboards
5. Set up backup strategies
6. Implement disaster recovery

For additional help, refer to:
- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [AWS CloudFormation Documentation](https://docs.aws.amazon.com/cloudformation/)
- [Project README](./photo-backend/README.md)