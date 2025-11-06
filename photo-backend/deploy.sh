#!/bin/bash

# Photo Backend Deployment Script (Bash version)
set -e

STACK_NAME=${1:-photo-backend}
ENVIRONMENT=${2:-dev}
REGION=${3:-us-east-1}

echo "Deploying photo backend..."
echo "Stack Name: $STACK_NAME"
echo "Environment: $ENVIRONMENT"
echo "Region: $REGION"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if SAM CLI is installed
if ! command -v sam &> /dev/null; then
    echo "SAM CLI is not installed. Please install it first."
    exit 1
fi

# Build the Go binary
echo "Building Go binary..."
GOOS=linux GOARCH=amd64 go build -o main main.go

# Deploy with SAM
echo "Deploying with SAM..."
sam deploy \
    --template-file template.yaml \
    --stack-name $STACK_NAME \
    --parameter-overrides Environment=$ENVIRONMENT \
    --capabilities CAPABILITY_IAM \
    --region $REGION \
    --no-confirm-changeset

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