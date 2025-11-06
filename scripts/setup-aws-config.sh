#!/bin/bash

# AWS Configuration Setup Script
# This script scans your AWS environment and creates configuration files

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
DEFAULT_REGION="us-east-1"
DEFAULT_ENVIRONMENT="dev"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if AWS CLI is installed and configured
check_aws_cli() {
    print_status "Checking AWS CLI installation..."
    
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check if AWS is configured
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS CLI is not configured. Please run 'aws configure' first."
        exit 1
    fi
    
    print_success "AWS CLI is installed and configured"
}

# Function to get AWS account information
get_aws_info() {
    print_status "Gathering AWS account information..."
    
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    AWS_USER_ARN=$(aws sts get-caller-identity --query Arn --output text)
    AWS_REGION=${AWS_DEFAULT_REGION:-$DEFAULT_REGION}
    
    print_success "AWS Account ID: $AWS_ACCOUNT_ID"
    print_success "AWS User: $AWS_USER_ARN"
    print_success "AWS Region: $AWS_REGION"
}

# Function to check existing resources
check_existing_resources() {
    print_status "Checking for existing resources..."
    
    # Check for existing S3 buckets
    EXISTING_BUCKETS=$(aws s3api list-buckets --query 'Buckets[?contains(Name, `photo`)].Name' --output text 2>/dev/null || echo "")
    if [ ! -z "$EXISTING_BUCKETS" ]; then
        print_warning "Found existing photo-related S3 buckets:"
        echo "$EXISTING_BUCKETS"
    fi
    
    # Check for existing DynamoDB tables
    EXISTING_TABLES=$(aws dynamodb list-tables --query 'TableNames[?contains(@, `photo`)]' --output text 2>/dev/null || echo "")
    if [ ! -z "$EXISTING_TABLES" ]; then
        print_warning "Found existing photo-related DynamoDB tables:"
        echo "$EXISTING_TABLES"
    fi
    
    # Check for existing Lambda functions
    EXISTING_FUNCTIONS=$(aws lambda list-functions --query 'Functions[?contains(FunctionName, `photo`)].FunctionName' --output text 2>/dev/null || echo "")
    if [ ! -z "$EXISTING_FUNCTIONS" ]; then
        print_warning "Found existing photo-related Lambda functions:"
        echo "$EXISTING_FUNCTIONS"
    fi
}

# Function to generate KMS key
generate_kms_key() {
    local environment=$1
    print_status "Generating KMS key for $environment environment..."
    
    # Check if KMS key already exists
    KEY_ALIAS="alias/photo-backend-$environment"
    EXISTING_KEY=$(aws kms describe-key --key-id "$KEY_ALIAS" --query 'KeyMetadata.KeyId' --output text 2>/dev/null || echo "")
    
    if [ ! -z "$EXISTING_KEY" ] && [ "$EXISTING_KEY" != "None" ]; then
        print_success "Using existing KMS key: $EXISTING_KEY"
        echo "$EXISTING_KEY"
    else
        # Create new KMS key
        KEY_ID=$(aws kms create-key \
            --description "Photo Backend encryption key for $environment" \
            --query 'KeyMetadata.KeyId' \
            --output text)
        
        # Create alias
        aws kms create-alias \
            --alias-name "$KEY_ALIAS" \
            --target-key-id "$KEY_ID"
        
        print_success "Created new KMS key: $KEY_ID"
        echo "$KEY_ID"
    fi
}

# Function to check Route53 hosted zones
check_route53_zones() {
    print_status "Checking Route53 hosted zones..."
    
    HOSTED_ZONES=$(aws route53 list-hosted-zones --query 'HostedZones[].{Name:Name,Id:Id}' --output table 2>/dev/null || echo "")
    if [ ! -z "$HOSTED_ZONES" ]; then
        print_success "Found Route53 hosted zones:"
        echo "$HOSTED_ZONES"
    else
        print_warning "No Route53 hosted zones found"
    fi
}

# Function to check ACM certificates
check_acm_certificates() {
    print_status "Checking ACM certificates..."
    
    CERTIFICATES=$(aws acm list-certificates --query 'CertificateSummaryList[].{Domain:DomainName,Arn:CertificateArn}' --output table 2>/dev/null || echo "")
    if [ ! -z "$CERTIFICATES" ]; then
        print_success "Found ACM certificates:"
        echo "$CERTIFICATES"
    else
        print_warning "No ACM certificates found"
    fi
}

# Function to generate secrets file
generate_secrets_file() {
    print_status "Generating secrets configuration file..."
    
    # Create config directory if it doesn't exist
    mkdir -p config
    
    # Generate encryption keys for dev and prod
    DEV_ENCRYPTION_KEY=$(openssl rand -hex 32)
    PROD_ENCRYPTION_KEY=$(openssl rand -hex 32)
    
    # Generate KMS keys
    DEV_KMS_KEY=$(generate_kms_key "dev")
    PROD_KMS_KEY=$(generate_kms_key "prod")
    
    # Create secrets file
    cat > config/secrets.json << EOF
{
  "dev": {
    "DatabaseEncryptionKey": "$DEV_ENCRYPTION_KEY",
    "S3KMSKeyId": "arn:aws:kms:$AWS_REGION:$AWS_ACCOUNT_ID:key/$DEV_KMS_KEY",
    "NotificationEmail": "dev@yourdomain.com",
    "CustomDomainName": "",
    "CertificateArn": "",
    "HostedZoneId": ""
  },
  "prod": {
    "DatabaseEncryptionKey": "$PROD_ENCRYPTION_KEY",
    "S3KMSKeyId": "arn:aws:kms:$AWS_REGION:$AWS_ACCOUNT_ID:key/$PROD_KMS_KEY",
    "NotificationEmail": "admin@yourdomain.com",
    "CustomDomainName": "api.yourdomain.com",
    "CertificateArn": "arn:aws:acm:$AWS_REGION:$AWS_ACCOUNT_ID:certificate/REPLACE-WITH-YOUR-CERT-ID",
    "HostedZoneId": "REPLACE-WITH-YOUR-HOSTED-ZONE-ID"
  }
}
EOF
    
    print_success "Created config/secrets.json"
    print_warning "Please update the domain-related values in config/secrets.json"
}

# Function to update gitignore
update_gitignore() {
    print_status "Updating .gitignore file..."
    
    # Create .gitignore if it doesn't exist
    if [ ! -f .gitignore ]; then
        touch .gitignore
    fi
    
    # Add secrets to gitignore if not already present
    if ! grep -q "config/secrets.json" .gitignore; then
        echo "" >> .gitignore
        echo "# AWS Secrets and Configuration" >> .gitignore
        echo "config/secrets.json" >> .gitignore
        echo "*.pem" >> .gitignore
        echo "*.key" >> .gitignore
        echo ".aws/" >> .gitignore
        print_success "Added secrets to .gitignore"
    else
        print_success ".gitignore already contains secrets configuration"
    fi
}

# Function to create deployment script
create_deployment_script() {
    print_status "Creating enhanced deployment script..."
    
    cat > deploy-with-secrets.sh << 'EOF'
#!/bin/bash

# Enhanced deployment script with secrets management
set -e

STACK_NAME=${1:-photo-backend}
ENVIRONMENT=${2:-dev}
REGION=${3:-us-east-1}

echo "Deploying photo backend with secrets..."
echo "Stack Name: $STACK_NAME"
echo "Environment: $ENVIRONMENT"
echo "Region: $REGION"

# Check if secrets file exists
if [ ! -f "config/secrets.json" ]; then
    echo "Error: config/secrets.json not found. Run setup-aws-config.sh first."
    exit 1
fi

# Extract secrets for the environment
SECRETS=$(cat config/secrets.json | jq -r ".$ENVIRONMENT")
if [ "$SECRETS" == "null" ]; then
    echo "Error: No secrets found for environment $ENVIRONMENT"
    exit 1
fi

# Build the application
echo "Building Go binary..."
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -ldflags="-s -w" -o main .

# Deploy with SAM
echo "Deploying with SAM..."
sam deploy \
    --template-file template.yaml \
    --stack-name $STACK_NAME \
    --parameter-overrides file://config/environments/$ENVIRONMENT.json \
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
    --region $REGION \
    --no-confirm-changeset \
    --no-fail-on-empty-changeset

# Get outputs
echo "Getting stack outputs..."
API_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`PhotoAPIEndpoint`].OutputValue' \
    --output text)

BUCKET_NAME=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`PhotoBucketName`].OutputValue' \
    --output text)

BUCKET_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`PhotoBucketURL`].OutputValue' \
    --output text)

echo ""
echo "Deployment completed successfully!"
echo ""
echo "API Endpoint: $API_ENDPOINT"
echo "S3 Bucket: $BUCKET_NAME"
echo "S3 Bucket URL: $BUCKET_URL"
echo ""
echo "Add these to your Next.js environment variables:"
echo "NEXT_PUBLIC_PHOTO_API_URL=$API_ENDPOINT"
echo "NEXT_PUBLIC_S3_BUCKET_URL=$BUCKET_URL"
EOF

    chmod +x deploy-with-secrets.sh
    print_success "Created deploy-with-secrets.sh"
}

# Function to create monitoring script
create_monitoring_script() {
    print_status "Creating monitoring script..."
    
    cat > scripts/monitor-stack.sh << 'EOF'
#!/bin/bash

# Stack monitoring script
STACK_NAME=${1:-photo-backend-dev}
REGION=${2:-us-east-1}

echo "Monitoring stack: $STACK_NAME in region: $REGION"

# Check stack status
echo "=== Stack Status ==="
aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].StackStatus' \
    --output text

# Check recent events
echo "=== Recent Events ==="
aws cloudformation describe-stack-events \
    --stack-name $STACK_NAME \
    --region $REGION \
    --max-items 10 \
    --query 'StackEvents[].[Timestamp,LogicalResourceId,ResourceStatus,ResourceStatusReason]' \
    --output table

# Check Lambda function metrics
echo "=== Lambda Metrics (Last 24 hours) ==="
FUNCTION_NAME=$(aws cloudformation describe-stack-resources \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'StackResources[?ResourceType==`AWS::Lambda::Function`].PhysicalResourceId' \
    --output text)

if [ ! -z "$FUNCTION_NAME" ]; then
    aws cloudwatch get-metric-statistics \
        --namespace AWS/Lambda \
        --metric-name Invocations \
        --dimensions Name=FunctionName,Value=$FUNCTION_NAME \
        --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \
        --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
        --period 3600 \
        --statistics Sum \
        --region $REGION \
        --query 'Datapoints[].{Time:Timestamp,Invocations:Sum}' \
        --output table
fi
EOF

    chmod +x scripts/monitor-stack.sh
    print_success "Created scripts/monitor-stack.sh"
}

# Main execution
main() {
    echo "=== AWS Photo Backend Configuration Setup ==="
    echo ""
    
    # Check prerequisites
    check_aws_cli
    
    # Get AWS information
    get_aws_info
    
    # Check existing resources
    check_existing_resources
    
    # Check Route53 and ACM
    check_route53_zones
    check_acm_certificates
    
    # Generate configuration files
    generate_secrets_file
    update_gitignore
    create_deployment_script
    
    # Create scripts directory
    mkdir -p scripts
    create_monitoring_script
    
    echo ""
    print_success "=== Setup Complete ==="
    echo ""
    print_status "Next steps:"
    echo "1. Review and update config/secrets.json with your domain information"
    echo "2. Update config/environments/*.json with your specific requirements"
    echo "3. Run ./deploy-with-secrets.sh to deploy your stack"
    echo "4. Use scripts/monitor-stack.sh to monitor your deployment"
    echo ""
    print_warning "Remember: config/secrets.json contains sensitive information and is excluded from git"
}

# Run main function
main "$@"