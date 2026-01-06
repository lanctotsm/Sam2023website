# Test Instructions for Photo Backend (WSL)

This guide provides step-by-step instructions for setting up the DynamoDB databases, configuring Lambda permissions, deploying the Lambda function, and testing image uploads using WSL (Windows Subsystem for Linux).

## Prerequisites

- WSL2 installed with Ubuntu or similar Linux distribution
- AWS CLI installed and configured with appropriate credentials in WSL
- Go 1.19+ installed in WSL
- AWS account with appropriate permissions
- jq installed for JSON processing: `sudo apt install jq`

## 0. AWS Cost Management Setup (IMPORTANT!)

Before creating any resources, set up cost controls to avoid unexpected charges. $100/month is more than sufficient for development and testing.

### Set Up Billing Alerts

```bash
# Create SNS topic for billing alerts
aws sns create-topic --name billing-alerts --region us-east-1

# Get the topic ARN (save this for later)
TOPIC_ARN=$(aws sns list-topics --region us-east-1 --query 'Topics[?contains(TopicArn, `billing-alerts`)].TopicArn' --output text)
echo "Topic ARN: $TOPIC_ARN"

# Subscribe your email to the topic
aws sns subscribe \
    --topic-arn $TOPIC_ARN \
    --protocol email \
    --notification-endpoint your-email@example.com \
    --region us-east-1

# Confirm the subscription in your email
```

### Create CloudWatch Billing Alarms

```bash
# Create alarm for $50 (50% of budget)
aws cloudwatch put-metric-alarm \
    --alarm-name "Billing-Alert-50USD" \
    --alarm-description "Billing alert when charges exceed $50" \
    --metric-name EstimatedCharges \
    --namespace AWS/Billing \
    --statistic Maximum \
    --period 86400 \
    --threshold 50 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=Currency,Value=USD \
    --evaluation-periods 1 \
    --alarm-actions $TOPIC_ARN \
    --region us-east-1

# Create alarm for $80 (80% of budget)
aws cloudwatch put-metric-alarm \
    --alarm-name "Billing-Alert-80USD" \
    --alarm-description "Billing alert when charges exceed $80" \
    --metric-name EstimatedCharges \
    --namespace AWS/Billing \
    --statistic Maximum \
    --period 86400 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=Currency,Value=USD \
    --evaluation-periods 1 \
    --alarm-actions $TOPIC_ARN \
    --region us-east-1

# Create alarm for $100 (full budget)
aws cloudwatch put-metric-alarm \
    --alarm-name "Billing-Alert-100USD" \
    --alarm-description "URGENT: Billing alert when charges exceed $100" \
    --metric-name EstimatedCharges \
    --namespace AWS/Billing \
    --statistic Maximum \
    --period 86400 \
    --threshold 100 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=Currency,Value=USD \
    --evaluation-periods 1 \
    --alarm-actions $TOPIC_ARN \
    --region us-east-1
```

### Set Up AWS Budgets (Recommended)

```bash
# Create budget configuration
cat > budget-config.json << EOF
{
  "BudgetName": "PhotoBackendBudget",
  "BudgetLimit": {
    "Amount": "100",
    "Unit": "USD"
  },
  "TimeUnit": "MONTHLY",
  "BudgetType": "COST",
  "CostFilters": {},
  "TimePeriod": {
    "Start": "$(date -d 'first day of this month' '+%Y-%m-01')",
    "End": "2030-12-31"
  }
}
EOF

# Create notifications configuration
cat > budget-notifications.json << EOF
[
  {
    "Notification": {
      "NotificationType": "ACTUAL",
      "ComparisonOperator": "GREATER_THAN",
      "Threshold": 50,
      "ThresholdType": "PERCENTAGE"
    },
    "Subscribers": [
      {
        "SubscriptionType": "EMAIL",
        "Address": "your-email@example.com"
      }
    ]
  },
  {
    "Notification": {
      "NotificationType": "ACTUAL",
      "ComparisonOperator": "GREATER_THAN",
      "Threshold": 80,
      "ThresholdType": "PERCENTAGE"
    },
    "Subscribers": [
      {
        "SubscriptionType": "EMAIL",
        "Address": "your-email@example.com"
      }
    ]
  },
  {
    "Notification": {
      "NotificationType": "FORECASTED",
      "ComparisonOperator": "GREATER_THAN",
      "Threshold": 100,
      "ThresholdType": "PERCENTAGE"
    },
    "Subscribers": [
      {
        "SubscriptionType": "EMAIL",
        "Address": "your-email@example.com"
      }
    ]
  }
]
EOF

# Create the budget
aws budgets create-budget \
    --account-id $(aws sts get-caller-identity --query Account --output text) \
    --budget file://budget-config.json \
    --notifications-with-subscribers file://budget-notifications.json
```

### Cost Optimization Settings

```bash
# Enable detailed billing reports (optional but helpful)
aws s3 mb s3://your-billing-reports-$(date +%s) --region us-east-1

# Set up cost allocation tags (helps track costs by resource)
aws resourcegroupstaggingapi tag-resources \
    --resource-arn-list "arn:aws:s3:::your-bucket-name" \
    --tags Project=PhotoBackend,Environment=Development
```

### Expected Monthly Costs (Development Usage)

For typical development and testing, expect these approximate costs:

- **DynamoDB**: $1-5/month (PAY_PER_REQUEST pricing)
- **Lambda**: $0-2/month (1M requests free tier)
- **S3**: $1-3/month (depending on storage and requests)
- **CloudWatch Logs**: $0-1/month
- **API Gateway**: $0-1/month (1M requests free tier)
- **Data Transfer**: $0-2/month

**Total Expected: $2-15/month** (well under your $100 budget)

### Set Up Auto-Shutdown Protection

Create an automatic shutdown system that disables resources when you hit 80% of your budget:

```bash
# Create auto-shutdown Lambda function
cat > auto-shutdown.py << 'EOF'
import boto3
import json
import os
from datetime import datetime

def lambda_handler(event, context):
    print(f"Received event: {json.dumps(event)}")
    
    try:
        # Parse SNS message
        message = json.loads(event['Records'][0]['Sns']['Message'])
        alarm_name = message['AlarmName']
        
        print(f"Processing alarm: {alarm_name}")
        
        if 'Billing-Alert-80USD' in alarm_name:
            print("80% budget threshold reached - taking protective actions")
            
            # Initialize AWS clients
            lambda_client = boto3.client('lambda', region_name='us-east-1')
            sns_client = boto3.client('sns', region_name='us-east-1')
            
            disabled_functions = []
            
            # Disable Lambda functions
            try:
                functions = lambda_client.list_functions()
                for func in functions['Functions']:
                    if 'photo-backend' in func['FunctionName']:
                        lambda_client.put_function_concurrency(
                            FunctionName=func['FunctionName'],
                            ReservedConcurrentExecutions=0
                        )
                        disabled_functions.append(func['FunctionName'])
                        print(f"Disabled function: {func['FunctionName']}")
            except Exception as e:
                print(f"Error disabling Lambda functions: {str(e)}")
            
            # Send notification
            try:
                alert_message = f"""
COST PROTECTION ACTIVATED!

Your AWS spending has reached 80% of the $100 monthly budget.
The following protective actions have been taken:

Disabled Lambda Functions:
{chr(10).join(disabled_functions) if disabled_functions else 'None found'}

Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}

To re-enable services:
1. Check your AWS costs in the billing console
2. If costs are acceptable, re-enable functions manually
3. Consider increasing your budget if needed

Command to re-enable:
aws lambda delete-function-concurrency --function-name photo-backend --region us-east-1
                """
                
                sns_client.publish(
                    TopicArn=os.environ['ALERT_TOPIC_ARN'],
                    Subject='🚨 AWS Auto-Shutdown Activated - Budget Protection',
                    Message=alert_message
                )
                print("Alert notification sent successfully")
            except Exception as e:
                print(f"Error sending notification: {str(e)}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Auto-shutdown processed successfully',
                'disabled_functions': disabled_functions
            })
        }
        
    except Exception as e:
        print(f"Error processing event: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
EOF

# Create IAM policy for auto-shutdown function
cat > auto-shutdown-policy.json << EOF
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
        "lambda:ListFunctions",
        "lambda:PutFunctionConcurrency",
        "lambda:DeleteFunctionConcurrency"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sns:Publish"
      ],
      "Resource": "$TOPIC_ARN"
    }
  ]
}
EOF

# Create IAM role for auto-shutdown
cat > auto-shutdown-trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create the role and policy
aws iam create-role \
    --role-name AutoShutdownRole \
    --assume-role-policy-document file://auto-shutdown-trust-policy.json

aws iam create-policy \
    --policy-name AutoShutdownPolicy \
    --policy-document file://auto-shutdown-policy.json

aws iam attach-role-policy \
    --role-name AutoShutdownRole \
    --policy-arn arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):policy/AutoShutdownPolicy

# Package and deploy the function
zip auto-shutdown.zip auto-shutdown.py

aws lambda create-function \
    --function-name auto-shutdown \
    --runtime python3.9 \
    --role arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/AutoShutdownRole \
    --handler auto-shutdown.lambda_handler \
    --zip-file fileb://auto-shutdown.zip \
    --environment Variables="{ALERT_TOPIC_ARN=$TOPIC_ARN}" \
    --timeout 60 \
    --region us-east-1

# Subscribe auto-shutdown to the 80% billing alert
aws sns subscribe \
    --topic-arn $TOPIC_ARN \
    --protocol lambda \
    --notification-endpoint arn:aws:lambda:us-east-1:$(aws sts get-caller-identity --query Account --output text):function:auto-shutdown \
    --region us-east-1

# Give SNS permission to invoke the function
aws lambda add-permission \
    --function-name auto-shutdown \
    --statement-id sns-invoke \
    --action lambda:InvokeFunction \
    --principal sns.amazonaws.com \
    --source-arn $TOPIC_ARN \
    --region us-east-1

# Clean up temporary files
rm -f auto-shutdown.py auto-shutdown.zip auto-shutdown-policy.json auto-shutdown-trust-policy.json

echo "✅ Auto-shutdown protection is now active!"
echo "When you reach 80% of your $100 budget, your Lambda functions will be automatically disabled."
echo "You'll receive an email with instructions on how to re-enable them."
```

### Test Auto-Shutdown (Optional)

```bash
# Test the auto-shutdown system (this won't actually trigger billing)
echo "Testing auto-shutdown system..."

# Trigger the 80% alarm manually
aws cloudwatch set-alarm-state \
    --alarm-name "Billing-Alert-80USD" \
    --state-value ALARM \
    --state-reason "Testing auto-shutdown system" \
    --region us-east-1

# Wait a moment for processing
sleep 10

# Check if your photo-backend function was disabled
echo "Checking if functions were disabled..."
aws lambda get-function-configuration \
    --function-name photo-backend \
    --region us-east-1 \
    --query 'ReservedConcurrencyConfig' || echo "Function not found or no concurrency limit set"

# Reset the alarm to OK state
aws cloudwatch set-alarm-state \
    --alarm-name "Billing-Alert-80USD" \
    --state-value OK \
    --state-reason "Test complete" \
    --region us-east-1

echo "Test complete. Check your email for the auto-shutdown notification."
```

### Re-enable Services After Auto-Shutdown

If auto-shutdown triggers, use these commands to re-enable your services:

```bash
# Re-enable Lambda function
aws lambda delete-function-concurrency \
    --function-name photo-backend \
    --region us-east-1

# Verify function is enabled
aws lambda get-function-configuration \
    --function-name photo-backend \
    --region us-east-1 \
    --query 'ReservedConcurrencyConfig'

# Should return null (no concurrency limit = enabled)
```

### Monitor Costs Regularly

```bash
# Check current month's costs
aws ce get-cost-and-usage \
    --time-period Start=$(date -d 'first day of this month' '+%Y-%m-01'),End=$(date '+%Y-%m-%d') \
    --granularity MONTHLY \
    --metrics BlendedCost \
    --group-by Type=DIMENSION,Key=SERVICE | jq '.ResultsByTime[0].Groups[] | select(.Metrics.BlendedCost.Amount != "0") | {Service: .Keys[0], Cost: .Metrics.BlendedCost.Amount}'

# Get cost by service for last 30 days
aws ce get-cost-and-usage \
    --time-period Start=$(date -d '30 days ago' '+%Y-%m-%d'),End=$(date '+%Y-%m-%d') \
    --granularity MONTHLY \
    --metrics BlendedCost \
    --group-by Type=DIMENSION,Key=SERVICE | jq '.ResultsByTime[0].Groups[] | select(.Metrics.BlendedCost.Amount != "0")'
```

## 1. Initialize DynamoDB Databases

### Create Required Tables

The photo backend requires several DynamoDB tables. Run these AWS CLI commands:

```bash
# Create Sessions table
aws dynamodb create-table \
    --table-name Sessions \
    --attribute-definitions AttributeName=session_id,AttributeType=S \
    --key-schema AttributeName=session_id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-1

# Create Photos table
aws dynamodb create-table \
    --table-name Photos \
    --attribute-definitions \
        AttributeName=photo_id,AttributeType=S \
        AttributeName=user_id,AttributeType=S \
    --key-schema AttributeName=photo_id,KeyType=HASH \
    --global-secondary-indexes \
        'IndexName=UserIndex,KeySchema=[{AttributeName=user_id,KeyType=HASH}],Projection={ProjectionType=ALL}' \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-1

# Create Users table
aws dynamodb create-table \
    --table-name Users \
    --attribute-definitions \
        AttributeName=user_id,AttributeType=S \
        AttributeName=email,AttributeType=S \
    --key-schema AttributeName=user_id,KeyType=HASH \
    --global-secondary-indexes \
        'IndexName=EmailIndex,KeySchema=[{AttributeName=email,KeyType=HASH}],Projection={ProjectionType=ALL}' \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-1
```

### Verify Tables Creation

```bash
# List all tables
aws dynamodb list-tables --region us-east-1

# Check specific table status
aws dynamodb describe-table --table-name Sessions --region us-east-1
aws dynamodb describe-table --table-name Photos --region us-east-1
aws dynamodb describe-table --table-name Users --region us-east-1

# Wait for all tables to be active
aws dynamodb wait table-exists --table-name Sessions --region us-east-1
aws dynamodb wait table-exists --table-name Photos --region us-east-1
aws dynamodb wait table-exists --table-name Users --region us-east-1
```

## 2. Create S3 Bucket for Photo Storage

```bash
# Create S3 bucket (replace with unique bucket name)
BUCKET_NAME="your-photo-bucket-$(date +%s)"
aws s3 mb s3://$BUCKET_NAME --region us-east-1

# Enable versioning (optional)
aws s3api put-bucket-versioning \
    --bucket $BUCKET_NAME \
    --versioning-configuration Status=Enabled

# Set CORS configuration for web uploads
cat > cors.json << EOF
{
    "CORSRules": [
        {
            "AllowedHeaders": ["*"],
            "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
            "AllowedOrigins": ["*"],
            "ExposeHeaders": []
        }
    ]
}
EOF

aws s3api put-bucket-cors --bucket $BUCKET_NAME --cors-configuration file://cors.json

echo "Created bucket: $BUCKET_NAME"
```

## 3. Configure Lambda Permissions

### Create IAM Role for Lambda

First, create a trust policy file:

```bash
# Create trust-policy.json
cat > trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
```

Create the IAM role:

```bash
aws iam create-role \
    --role-name PhotoBackendLambdaRole \
    --assume-role-policy-document file://trust-policy.json
```

### Create and Attach Policy

Create a policy file for DynamoDB and S3 permissions:

```bash
# Get AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Create lambda-policy.json
cat > lambda-policy.json << EOF
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
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-east-1:$ACCOUNT_ID:table/Sessions",
        "arn:aws:dynamodb:us-east-1:$ACCOUNT_ID:table/Photos",
        "arn:aws:dynamodb:us-east-1:$ACCOUNT_ID:table/Users",
        "arn:aws:dynamodb:us-east-1:$ACCOUNT_ID:table/Sessions/index/*",
        "arn:aws:dynamodb:us-east-1:$ACCOUNT_ID:table/Photos/index/*",
        "arn:aws:dynamodb:us-east-1:$ACCOUNT_ID:table/Users/index/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
    }
  ]
}
EOF
```

Create and attach the policy:

```bash
# Create the policy
aws iam create-policy \
    --policy-name PhotoBackendLambdaPolicy \
    --policy-document file://lambda-policy.json

# Attach policy to role
aws iam attach-role-policy \
    --role-name PhotoBackendLambdaRole \
    --policy-arn arn:aws:iam::$ACCOUNT_ID:policy/PhotoBackendLambdaPolicy

# Attach basic execution role
aws iam attach-role-policy \
    --role-name PhotoBackendLambdaRole \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
```

## 4. Build and Deploy Lambda Function

### Build the Go Binary

```bash
# Navigate to photo-backend directory
cd photo-backend

# Build for Linux (Lambda runtime)
GOOS=linux GOARCH=amd64 go build -o bootstrap main.go

# Create deployment package
zip function.zip bootstrap

# Optional: Add any additional files needed
# zip -r function.zip bootstrap config/ templates/
```

### Deploy Lambda Function

```bash
# Create Lambda function
aws lambda create-function \
    --function-name photo-backend \
    --runtime provided.al2 \
    --role arn:aws:iam::$ACCOUNT_ID:role/PhotoBackendLambdaRole \
    --handler bootstrap \
    --zip-file fileb://function.zip \
    --timeout 30 \
    --memory-size 256 \
    --region us-east-1

# Set environment variables
aws lambda update-function-configuration \
    --function-name photo-backend \
    --environment Variables="{DYNAMODB_REGION=us-east-1,S3_BUCKET=$BUCKET_NAME,JWT_SECRET=your-jwt-secret-key}" \
    --region us-east-1
```

### Create API Gateway (Optional)

```bash
# Create REST API
API_ID=$(aws apigateway create-rest-api \
    --name photo-backend-api \
    --region us-east-1 \
    --query 'id' --output text)

# Get root resource ID
ROOT_ID=$(aws apigateway get-resources \
    --rest-api-id $API_ID \
    --region us-east-1 \
    --query 'items[0].id' --output text)

# Create proxy resource
aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $ROOT_ID \
    --path-part '{proxy+}' \
    --region us-east-1

# Add Lambda permission for API Gateway
aws lambda add-permission \
    --function-name photo-backend \
    --statement-id api-gateway-invoke \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:us-east-1:$ACCOUNT_ID:$API_ID/*/*" \
    --region us-east-1

echo "API Gateway ID: $API_ID"
```

## 5. Test Image Upload

### Method 1: Using AWS CLI

```bash
# Test Lambda function directly
aws lambda invoke \
    --function-name photo-backend \
    --payload '{"httpMethod":"GET","path":"/health","headers":{}}' \
    --region us-east-1 \
    response.json

# View response
cat response.json | jq '.'

# Test with a more complex payload
cat > test-payload.json << EOF
{
  "httpMethod": "POST",
  "path": "/upload",
  "headers": {
    "Content-Type": "multipart/form-data"
  },
  "body": "test-image-data",
  "isBase64Encoded": false
}
EOF

aws lambda invoke \
    --function-name photo-backend \
    --payload file://test-payload.json \
    --region us-east-1 \
    upload-response.json

cat upload-response.json | jq '.'
```

### Method 2: Using AWS Console

1. Navigate to AWS Lambda Console
2. Find your `photo-backend` function
3. Click "Test" tab
4. Create a new test event with API Gateway proxy template
5. Modify the test event to simulate an image upload request
6. Execute the test and review logs

### Method 3: Using curl (if API Gateway is configured)

```bash
# Create a test image file
echo "fake image data" > test-image.jpg

# Test API Gateway endpoint (replace with your API ID)
curl -X POST "https://$API_ID.execute-api.us-east-1.amazonaws.com/prod/upload" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@test-image.jpg" \
     -v

# Test health endpoint
curl -X GET "https://$API_ID.execute-api.us-east-1.amazonaws.com/prod/health" \
     -H "Accept: application/json" \
     -v
```

## 6. Verify Upload

### Check S3 Bucket

```bash
# List objects in bucket
aws s3 ls s3://$BUCKET_NAME --recursive

# Download uploaded file to verify
aws s3 cp s3://$BUCKET_NAME/uploads/sample-photo.jpg downloaded-file.jpg

# Check bucket size and object count
aws s3 ls s3://$BUCKET_NAME --recursive --human-readable --summarize
```

### Check DynamoDB

```bash
# Scan Photos table
aws dynamodb scan --table-name Photos --region us-east-1 | jq '.'

# Scan Users table
aws dynamodb scan --table-name Users --region us-east-1 | jq '.'

# Query specific photo (replace with actual photo ID)
aws dynamodb get-item \
    --table-name Photos \
    --key '{"photo_id":{"S":"sample-photo-id"}}' \
    --region us-east-1 | jq '.'

# Count items in each table
echo "Sessions count:"
aws dynamodb scan --table-name Sessions --select COUNT --region us-east-1 | jq '.Count'

echo "Photos count:"
aws dynamodb scan --table-name Photos --select COUNT --region us-east-1 | jq '.Count'

echo "Users count:"
aws dynamodb scan --table-name Users --select COUNT --region us-east-1 | jq '.Count'
```

## Troubleshooting

### Common Issues

1. **Permission Denied**: Ensure IAM role has correct policies attached
2. **Table Not Found**: Verify DynamoDB tables are created and in correct region
3. **Lambda Timeout**: Increase timeout in Lambda configuration
4. **Memory Issues**: Increase memory allocation for Lambda function

### View Logs

```bash
# View Lambda logs
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/photo-backend

# Get recent log events (last hour)
START_TIME=$(date -d '1 hour ago' +%s)000
aws logs filter-log-events \
    --log-group-name /aws/lambda/photo-backend \
    --start-time $START_TIME | jq '.events[].message' -r

# Tail logs in real-time (requires awslogs: pip install awslogs)
# awslogs get /aws/lambda/photo-backend --watch
```

### Update Lambda Function

```bash
# Rebuild and update
cd photo-backend
GOOS=linux GOARCH=amd64 go build -o bootstrap main.go
zip function.zip bootstrap

aws lambda update-function-code \
    --function-name photo-backend \
    --zip-file fileb://function.zip \
    --region us-east-1

# Update environment variables if needed
aws lambda update-function-configuration \
    --function-name photo-backend \
    --environment Variables="{DYNAMODB_REGION=us-east-1,S3_BUCKET=$BUCKET_NAME,JWT_SECRET=updated-secret}" \
    --region us-east-1
```

## Environment Variables

Make sure to set these environment variables in your Lambda function:

- `DYNAMODB_REGION`: AWS region for DynamoDB (e.g., us-east-1)
- `S3_BUCKET`: Name of your S3 bucket for photo storage
- `JWT_SECRET`: Secret key for JWT token generation
- `OAUTH_CLIENT_ID`: OAuth client ID (if using OAuth)
- `OAUTH_CLIENT_SECRET`: OAuth client secret (if using OAuth)

## Security Notes

- Never commit AWS credentials to version control
- Use IAM roles with minimal required permissions
- Enable CloudTrail for audit logging
- Consider using AWS Secrets Manager for sensitive configuration
- Implement proper input validation and sanitization
- Use HTTPS for all API endpoints

## Next Steps

1. Set up monitoring with CloudWatch
2. Implement proper error handling and logging
3. Add integration tests
4. Set up CI/CD pipeline
5. Configure custom domain for API Gateway
6. Implement rate limiting and throttling
##
 WSL-Specific Setup

### Install Required Tools in WSL

```bash
# Update package list
sudo apt update

# Install essential tools
sudo apt install -y curl unzip jq

# Install AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Install Go (if not already installed)
wget https://go.dev/dl/go1.21.0.linux-amd64.tar.gz
sudo rm -rf /usr/local/go && sudo tar -C /usr/local -xzf go1.21.0.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc

# Verify installations
aws --version
go version
jq --version
```

### Configure AWS CLI

```bash
# Configure AWS credentials
aws configure

# Or set environment variables
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_DEFAULT_REGION=us-east-1

# Test configuration
aws sts get-caller-identity
```

### Useful WSL Commands

```bash
# Access Windows files from WSL
cd /mnt/c/Users/YourUsername/

# Copy files between WSL and Windows
cp /mnt/c/path/to/file.jpg ~/
cp ~/file.jpg /mnt/c/Users/YourUsername/Desktop/

# Run Windows executables from WSL
/mnt/c/Windows/System32/notepad.exe file.txt
```

## Automation Script

Create a setup script to automate the entire process:

```bash
#!/bin/bash
# setup-photo-backend.sh

set -e  # Exit on any error

echo "Setting up Photo Backend infrastructure..."

# Variables
REGION="us-east-1"
BUCKET_NAME="photo-backend-$(date +%s)"
FUNCTION_NAME="photo-backend"
ROLE_NAME="PhotoBackendLambdaRole"

# Get AWS Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "AWS Account ID: $ACCOUNT_ID"

# Create DynamoDB tables
echo "Creating DynamoDB tables..."
aws dynamodb create-table \
    --table-name Sessions \
    --attribute-definitions AttributeName=session_id,AttributeType=S \
    --key-schema AttributeName=session_id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region $REGION

aws dynamodb create-table \
    --table-name Photos \
    --attribute-definitions \
        AttributeName=photo_id,AttributeType=S \
        AttributeName=user_id,AttributeType=S \
    --key-schema AttributeName=photo_id,KeyType=HASH \
    --global-secondary-indexes \
        'IndexName=UserIndex,KeySchema=[{AttributeName=user_id,KeyType=HASH}],Projection={ProjectionType=ALL}' \
    --billing-mode PAY_PER_REQUEST \
    --region $REGION

aws dynamodb create-table \
    --table-name Users \
    --attribute-definitions \
        AttributeName=user_id,AttributeType=S \
        AttributeName=email,AttributeType=S \
    --key-schema AttributeName=user_id,KeyType=HASH \
    --global-secondary-indexes \
        'IndexName=EmailIndex,KeySchema=[{AttributeName=email,KeyType=HASH}],Projection={ProjectionType=ALL}' \
    --billing-mode PAY_PER_REQUEST \
    --region $REGION

# Wait for tables to be active
echo "Waiting for tables to be active..."
aws dynamodb wait table-exists --table-name Sessions --region $REGION
aws dynamodb wait table-exists --table-name Photos --region $REGION
aws dynamodb wait table-exists --table-name Users --region $REGION

# Create S3 bucket
echo "Creating S3 bucket: $BUCKET_NAME"
aws s3 mb s3://$BUCKET_NAME --region $REGION

# Create IAM role and policies
echo "Creating IAM role and policies..."
cat > trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

aws iam create-role \
    --role-name $ROLE_NAME \
    --assume-role-policy-document file://trust-policy.json

cat > lambda-policy.json << EOF
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
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:$REGION:$ACCOUNT_ID:table/Sessions",
        "arn:aws:dynamodb:$REGION:$ACCOUNT_ID:table/Photos",
        "arn:aws:dynamodb:$REGION:$ACCOUNT_ID:table/Users",
        "arn:aws:dynamodb:$REGION:$ACCOUNT_ID:table/*/index/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
    }
  ]
}
EOF

aws iam create-policy \
    --policy-name PhotoBackendLambdaPolicy \
    --policy-document file://lambda-policy.json

aws iam attach-role-policy \
    --role-name $ROLE_NAME \
    --policy-arn arn:aws:iam::$ACCOUNT_ID:policy/PhotoBackendLambdaPolicy

aws iam attach-role-policy \
    --role-name $ROLE_NAME \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Build and deploy Lambda
echo "Building and deploying Lambda function..."
cd photo-backend
GOOS=linux GOARCH=amd64 go build -o bootstrap main.go
zip function.zip bootstrap

# Wait a bit for IAM role to propagate
echo "Waiting for IAM role to propagate..."
sleep 10

aws lambda create-function \
    --function-name $FUNCTION_NAME \
    --runtime provided.al2 \
    --role arn:aws:iam::$ACCOUNT_ID:role/$ROLE_NAME \
    --handler bootstrap \
    --zip-file fileb://function.zip \
    --timeout 30 \
    --memory-size 256 \
    --region $REGION

aws lambda update-function-configuration \
    --function-name $FUNCTION_NAME \
    --environment Variables="{DYNAMODB_REGION=$REGION,S3_BUCKET=$BUCKET_NAME,JWT_SECRET=your-jwt-secret-here}" \
    --region $REGION

echo "Setup complete!"
echo "Bucket name: $BUCKET_NAME"
echo "Function name: $FUNCTION_NAME"
echo "Region: $REGION"

# Test the function
echo "Testing Lambda function..."
aws lambda invoke \
    --function-name $FUNCTION_NAME \
    --payload '{"httpMethod":"GET","path":"/health"}' \
    --region $REGION \
    test-response.json

echo "Test response:"
cat test-response.json | jq '.'

# Cleanup temp files
rm -f trust-policy.json lambda-policy.json function.zip bootstrap test-response.json

echo "All done! Your photo backend is ready for testing."
```

Make the script executable and run it:

```bash
chmod +x setup-photo-backend.sh
./setup-photo-backend.sh
```
## Cost
 Management and Cleanup

### Daily Cost Monitoring Script

Create a script to check your daily AWS costs:

```bash
#!/bin/bash
# check-costs.sh

echo "=== AWS Cost Report ==="
echo "Date: $(date)"
echo

# Current month costs
echo "Current month total:"
aws ce get-cost-and-usage \
    --time-period Start=$(date -d 'first day of this month' '+%Y-%m-01'),End=$(date '+%Y-%m-%d') \
    --granularity MONTHLY \
    --metrics BlendedCost | jq -r '.ResultsByTime[0].Total.BlendedCost.Amount + " USD"'

echo
echo "Top services this month:"
aws ce get-cost-and-usage \
    --time-period Start=$(date -d 'first day of this month' '+%Y-%m-01'),End=$(date '+%Y-%m-%d') \
    --granularity MONTHLY \
    --metrics BlendedCost \
    --group-by Type=DIMENSION,Key=SERVICE | \
    jq -r '.ResultsByTime[0].Groups[] | select(.Metrics.BlendedCost.Amount != "0") | .Keys[0] + ": $" + .Metrics.BlendedCost.Amount' | \
    sort -k2 -nr | head -10

echo
echo "Yesterday's costs:"
aws ce get-cost-and-usage \
    --time-period Start=$(date -d 'yesterday' '+%Y-%m-%d'),End=$(date '+%Y-%m-%d') \
    --granularity DAILY \
    --metrics BlendedCost | jq -r '.ResultsByTime[0].Total.BlendedCost.Amount + " USD"'
```

Make it executable and run daily:

```bash
chmod +x check-costs.sh
./check-costs.sh

# Add to crontab for daily reports (optional)
# crontab -e
# Add: 0 9 * * * /path/to/check-costs.sh
```

### Resource Cleanup Commands

When you're done testing, clean up resources to avoid ongoing costs:

```bash
#!/bin/bash
# cleanup-resources.sh

echo "Cleaning up AWS resources..."

# Delete Lambda function
aws lambda delete-function --function-name photo-backend --region us-east-1

# Delete API Gateway (if created)
# API_ID=$(aws apigateway get-rest-apis --query 'items[?name==`photo-backend-api`].id' --output text)
# aws apigateway delete-rest-api --rest-api-id $API_ID --region us-east-1

# Empty and delete S3 bucket
BUCKET_NAME=$(aws lambda get-function-configuration --function-name photo-backend --region us-east-1 --query 'Environment.Variables.S3_BUCKET' --output text 2>/dev/null || echo "")
if [ ! -z "$BUCKET_NAME" ]; then
    aws s3 rm s3://$BUCKET_NAME --recursive
    aws s3 rb s3://$BUCKET_NAME
fi

# Delete DynamoDB tables
aws dynamodb delete-table --table-name Sessions --region us-east-1
aws dynamodb delete-table --table-name Photos --region us-east-1
aws dynamodb delete-table --table-name Users --region us-east-1

# Delete IAM role and policy
aws iam detach-role-policy --role-name PhotoBackendLambdaRole --policy-arn arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):policy/PhotoBackendLambdaPolicy
aws iam detach-role-policy --role-name PhotoBackendLambdaRole --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
aws iam delete-policy --policy-arn arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):policy/PhotoBackendLambdaPolicy
aws iam delete-role --role-name PhotoBackendLambdaRole

# Delete CloudWatch log groups
aws logs delete-log-group --log-group-name /aws/lambda/photo-backend --region us-east-1

echo "Cleanup complete!"
```

### Cost Alerts Setup Verification

```bash
# Verify billing alerts are set up
echo "Checking CloudWatch alarms:"
aws cloudwatch describe-alarms --alarm-names "Billing-Alert-50USD" "Billing-Alert-80USD" "Billing-Alert-100USD" --region us-east-1

echo "Checking SNS subscriptions:"
aws sns list-subscriptions-by-topic --topic-arn $TOPIC_ARN --region us-east-1

echo "Checking budgets:"
aws budgets describe-budgets --account-id $(aws sts get-caller-identity --query Account --output text)
```

### Emergency Cost Controls

If costs start approaching your limit:

```bash
# Stop all Lambda functions (prevents execution costs)
aws lambda list-functions --query 'Functions[].FunctionName' --output text | \
xargs -I {} aws lambda put-function-concurrency --function-name {} --reserved-concurrent-executions 0

# Disable API Gateway stages (prevents API calls)
# aws apigateway update-stage --rest-api-id $API_ID --stage-name prod --patch-ops op=replace,path=/throttle/rateLimit,value=0

# Set S3 bucket to Glacier storage class for cost savings
# aws s3 cp s3://$BUCKET_NAME s3://$BUCKET_NAME --recursive --storage-class GLACIER
```

### Best Practices for Cost Control

1. **Use Free Tier**: Stay within AWS Free Tier limits when possible
2. **Monitor Daily**: Check costs daily during development
3. **Clean Up**: Delete unused resources immediately
4. **Use Tags**: Tag all resources for better cost tracking
5. **Set Alerts**: Multiple alert thresholds (50%, 80%, 100%)
6. **Test Locally**: Use local DynamoDB and S3 emulators when possible

### Local Development Alternatives (Cost-Free)

For development without AWS costs:

```bash
# Install DynamoDB Local
wget https://s3.us-west-2.amazonaws.com/dynamodb-local/dynamodb_local_latest.tar.gz
tar -xzf dynamodb_local_latest.tar.gz
java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb

# Install LocalStack for S3 emulation
pip install localstack
localstack start

# Use these endpoints in your Go code for local testing
# DynamoDB: http://localhost:8000
# S3: http://localhost:4566
```

Remember: $100/month is generous for this project. Most development work will cost under $15/month, leaving plenty of buffer for experimentation and learning!## Hard C
ost Protection (Advanced)

**IMPORTANT**: The billing alerts above are notifications only. AWS doesn't provide automatic spending limits. Here are additional protection mechanisms:

### Option 1: Lambda-Based Auto-Shutdown

Create a Lambda function that automatically shuts down resources when costs exceed thresholds:

```bash
# Create auto-shutdown Lambda function
cat > auto-shutdown.py << 'EOF'
import boto3
import json
import os
from datetime import datetime, timedelta

def lambda_handler(event, context):
    # Parse SNS message
    message = json.loads(event['Records'][0]['Sns']['Message'])
    alarm_name = message['AlarmName']
    
    if 'Billing-Alert-80USD' in alarm_name:
        print("80% threshold reached - taking protective actions")
        
        # Disable Lambda functions
        lambda_client = boto3.client('lambda')
        functions = lambda_client.list_functions()
        
        for func in functions['Functions']:
            if 'photo-backend' in func['FunctionName']:
                lambda_client.put_function_concurrency(
                    FunctionName=func['FunctionName'],
                    ReservedConcurrentExecutions=0
                )
                print(f"Disabled function: {func['FunctionName']}")
        
        # Send alert email
        sns = boto3.client('sns')
        sns.publish(
            TopicArn=os.environ['ALERT_TOPIC_ARN'],
            Subject='AWS Auto-Shutdown Activated',
            Message='Cost threshold reached. Lambda functions have been disabled to prevent further charges.'
        )
        
    return {'statusCode': 200}
EOF

# Package the function
zip auto-shutdown.zip auto-shutdown.py

# Create the auto-shutdown function
aws lambda create-function \
    --function-name auto-shutdown \
    --runtime python3.9 \
    --role arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/PhotoBackendLambdaRole \
    --handler auto-shutdown.lambda_handler \
    --zip-file fileb://auto-shutdown.zip \
    --environment Variables="{ALERT_TOPIC_ARN=$TOPIC_ARN}" \
    --region us-east-1

# Subscribe auto-shutdown to billing alerts
aws sns subscribe \
    --topic-arn $TOPIC_ARN \
    --protocol lambda \
    --notification-endpoint arn:aws:lambda:us-east-1:$(aws sts get-caller-identity --query Account --output text):function:auto-shutdown \
    --region us-east-1

# Give SNS permission to invoke the function
aws lambda add-permission \
    --function-name auto-shutdown \
    --statement-id sns-invoke \
    --action lambda:InvokeFunction \
    --principal sns.amazonaws.com \
    --source-arn $TOPIC_ARN \
    --region us-east-1
```

### Option 2: AWS Organizations with SCPs (Most Secure)

If you have AWS Organizations, you can create Service Control Policies to hard-limit spending:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Action": "*",
      "Resource": "*",
      "Condition": {
        "NumericGreaterThan": {
          "aws:RequestedRegion": "us-east-1"
        }
      }
    }
  ]
}
```

### Option 3: Credit Card with Low Limit

The most foolproof method:

1. Get a prepaid credit card or set a low limit ($150) on your payment method
2. AWS will suspend services when payment fails
3. This is the only true "hard stop" available

### Option 4: Daily Spending Checks with Auto-Actions

Create a more aggressive monitoring script:

```bash
#!/bin/bash
# aggressive-cost-monitor.sh

DAILY_LIMIT=5  # $5 per day max
MONTHLY_LIMIT=100

# Get today's costs
TODAY_COST=$(aws ce get-cost-and-usage \
    --time-period Start=$(date '+%Y-%m-%d'),End=$(date -d 'tomorrow' '+%Y-%m-%d') \
    --granularity DAILY \
    --metrics BlendedCost \
    --query 'ResultsByTime[0].Total.BlendedCost.Amount' --output text)

# Get month-to-date costs
MONTH_COST=$(aws ce get-cost-and-usage \
    --time-period Start=$(date -d 'first day of this month' '+%Y-%m-01'),End=$(date '+%Y-%m-%d') \
    --granularity MONTHLY \
    --metrics BlendedCost \
    --query 'ResultsByTime[0].Total.BlendedCost.Amount' --output text)

echo "Today's cost: \$${TODAY_COST}"
echo "Month-to-date: \$${MONTH_COST}"

# Check if we're over daily limit
if (( $(echo "$TODAY_COST > $DAILY_LIMIT" | bc -l) )); then
    echo "ALERT: Daily limit exceeded!"
    
    # Disable all Lambda functions
    aws lambda list-functions --query 'Functions[].FunctionName' --output text | \
    xargs -I {} aws lambda put-function_concurrency --function-name {} --reserved-concurrent-executions 0
    
    # Send alert
    aws sns publish --topic-arn $TOPIC_ARN --message "Daily spending limit exceeded: \$${TODAY_COST}"
fi

# Check monthly limit
if (( $(echo "$MONTH_COST > $MONTHLY_LIMIT" | bc -l) )); then
    echo "CRITICAL: Monthly limit exceeded!"
    
    # More aggressive shutdown - delete resources
    ./cleanup-resources.sh
    
    aws sns publish --topic-arn $TOPIC_ARN --message "CRITICAL: Monthly limit exceeded. All resources deleted."
fi
```

Run this script every hour:

```bash
chmod +x aggressive-cost-monitor.sh

# Add to crontab to run every hour
crontab -e
# Add: 0 * * * * /path/to/aggressive-cost-monitor.sh
```

### Option 5: AWS Cost Anomaly Detection

Set up anomaly detection for unusual spending patterns:

```bash
# Create cost anomaly detector
aws ce create-anomaly-detector \
    --anomaly-detector AnomalyDetectorArn=string,DimensionKey=SERVICE,MatchOptions=EQUALS,Values=AWSLambda \
    --region us-east-1

# Create anomaly subscription
aws ce create-anomaly-subscription \
    --anomaly-subscription SubscriptionName=PhotoBackendAnomalies,MonitorArnList=arn:aws:ce::$(aws sts get-caller-identity --query Account --output text):anomalydetector/service,Subscribers=[{Address=your-email@example.com,Type=EMAIL}],Threshold=10.0 \
    --region us-east-1
```

### Summary of Protection Levels

1. **Basic (Notifications)**: Billing alerts + budgets ✅ (what we set up initially)
2. **Moderate (Auto-disable)**: Lambda auto-shutdown at 80% ✅ (Option 1 above)
3. **Aggressive (Daily limits)**: Hourly monitoring with auto-cleanup ✅ (Option 4 above)
4. **Nuclear (Hard stop)**: Low-limit credit card ✅ (Option 3 above)

**Recommendation**: Use Option 1 (Lambda auto-shutdown) + Option 4 (daily monitoring) for good protection without being too restrictive. The low-limit credit card (Option 3) is the only true guarantee against overspending.

### Testing Your Protection

```bash
# Test billing alert (this won't actually charge you)
aws cloudwatch set-alarm-state \
    --alarm-name "Billing-Alert-80USD" \
    --state-value ALARM \
    --state-reason "Testing auto-shutdown" \
    --region us-east-1

# Check if auto-shutdown worked
aws lambda get-function-configuration --function-name photo-backend --query 'ReservedConcurrencyConfig' --region us-east-1
```

The combination of these methods gives you strong protection, but remember: **the only 100% guarantee is a payment method with a hard limit**.