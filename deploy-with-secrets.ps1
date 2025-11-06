# Enhanced deployment script with secrets management (PowerShell)
param(
    [string]$StackName = "photo-backend",
    [string]$Environment = "dev",
    [string]$Region = "us-east-1"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Deploying photo backend with secrets..." -ForegroundColor Green
Write-Host "Stack Name: $StackName" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Cyan
Write-Host "Region: $Region" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the correct directory
if (!(Test-Path "photo-backend")) {
    Write-Host "⚠️  Changing to photo-backend directory..." -ForegroundColor Yellow
    if (Test-Path "photo-backend") {
        Set-Location "photo-backend"
    } else {
        Write-Host "❌ photo-backend directory not found. Please run from project root." -ForegroundColor Red
        exit 1
    }
}

# Check if secrets file exists
if (!(Test-Path "config/secrets.json")) {
    Write-Host "❌ config/secrets.json not found." -ForegroundColor Red
    Write-Host "💡 Run .\scripts\setup-aws-config.ps1 first to generate secrets." -ForegroundColor Yellow
    exit 1
}

# Check if environment config exists
if (!(Test-Path "config/environments/$Environment.json")) {
    Write-Host "❌ config/environments/$Environment.json not found." -ForegroundColor Red
    Write-Host "💡 Available environments:" -ForegroundColor Yellow
    Get-ChildItem "config/environments/*.json" | ForEach-Object { Write-Host "  - $($_.BaseName)" -ForegroundColor Gray }
    exit 1
}

# Extract secrets for the environment
try {
    $secrets = Get-Content "config/secrets.json" | ConvertFrom-Json
    $envSecrets = $secrets.$Environment
    if (!$envSecrets) {
        Write-Host "❌ No secrets found for environment '$Environment'" -ForegroundColor Red
        Write-Host "💡 Available environments in secrets:" -ForegroundColor Yellow
        $secrets.PSObject.Properties.Name | ForEach-Object { Write-Host "  - $_" -ForegroundColor Gray }
        exit 1
    }
    Write-Host "✅ Secrets loaded for environment: $Environment" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to parse secrets file: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Check prerequisites
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow

# Check AWS CLI
try {
    aws --version | Out-Null
    Write-Host "✅ AWS CLI is available" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI not found. Please install AWS CLI." -ForegroundColor Red
    exit 1
}

# Check SAM CLI
try {
    sam --version | Out-Null
    Write-Host "✅ SAM CLI is available" -ForegroundColor Green
} catch {
    Write-Host "❌ SAM CLI not found. Please install SAM CLI." -ForegroundColor Red
    Write-Host "💡 Install with: pip install aws-sam-cli" -ForegroundColor Yellow
    exit 1
}

# Check Go
try {
    go version | Out-Null
    Write-Host "✅ Go is available" -ForegroundColor Green
} catch {
    Write-Host "❌ Go not found. Please install Go." -ForegroundColor Red
    exit 1
}

# Check AWS credentials
try {
    aws sts get-caller-identity | Out-Null
    $awsAccount = aws sts get-caller-identity --query Account --output text
    Write-Host "✅ AWS credentials configured (Account: $awsAccount)" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS credentials not configured. Run 'aws configure'." -ForegroundColor Red
    exit 1
}

# Build the application
Write-Host ""
Write-Host "🔨 Building Go binary..." -ForegroundColor Yellow
$env:GOOS = "linux"
$env:GOARCH = "amd64"
$env:CGO_ENABLED = "0"

try {
    go build -ldflags="-s -w" -o main .
    Write-Host "✅ Go binary built successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to build Go binary: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Validate SAM template
Write-Host ""
Write-Host "🔍 Validating SAM template..." -ForegroundColor Yellow
try {
    sam validate --template template.yaml
    Write-Host "✅ SAM template is valid" -ForegroundColor Green
} catch {
    Write-Host "❌ SAM template validation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Deploy with SAM
Write-Host ""
Write-Host "🚀 Deploying with SAM..." -ForegroundColor Yellow
Write-Host "This may take several minutes..." -ForegroundColor Gray

try {
    sam deploy `
        --template-file template.yaml `
        --stack-name $StackName `
        --parameter-overrides "file://config/environments/$Environment.json" `
        --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM `
        --region $Region `
        --no-confirm-changeset `
        --no-fail-on-empty-changeset

    Write-Host "✅ SAM deployment completed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ SAM deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Troubleshooting tips:" -ForegroundColor Yellow
    Write-Host "  - Check CloudFormation console for detailed error messages" -ForegroundColor Gray
    Write-Host "  - Verify your AWS permissions" -ForegroundColor Gray
    Write-Host "  - Check if stack name already exists with different parameters" -ForegroundColor Gray
    exit 1
}

# Get stack outputs
Write-Host ""
Write-Host "📊 Getting stack outputs..." -ForegroundColor Yellow
try {
    $apiEndpoint = aws cloudformation describe-stacks `
        --stack-name $StackName `
        --region $Region `
        --query 'Stacks[0].Outputs[?OutputKey==`PhotoAPIEndpoint`].OutputValue' `
        --output text

    $bucketName = aws cloudformation describe-stacks `
        --stack-name $StackName `
        --region $Region `
        --query 'Stacks[0].Outputs[?OutputKey==`PhotoBucketName`].OutputValue' `
        --output text

    $bucketUrl = aws cloudformation describe-stacks `
        --stack-name $StackName `
        --region $Region `
        --query 'Stacks[0].Outputs[?OutputKey==`PhotoBucketURL`].OutputValue' `
        --output text

    $lambdaFunction = aws cloudformation describe-stacks `
        --stack-name $StackName `
        --region $Region `
        --query 'Stacks[0].Outputs[?OutputKey==`LambdaFunctionName`].OutputValue' `
        --output text

    Write-Host ""
    Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Stack Information:" -ForegroundColor Cyan
    Write-Host "  Stack Name: $StackName" -ForegroundColor White
    Write-Host "  Environment: $Environment" -ForegroundColor White
    Write-Host "  Region: $Region" -ForegroundColor White
    Write-Host ""
    Write-Host "🔗 Endpoints:" -ForegroundColor Cyan
    Write-Host "  API Endpoint: $apiEndpoint" -ForegroundColor White
    Write-Host "  S3 Bucket: $bucketName" -ForegroundColor White
    Write-Host "  S3 Bucket URL: $bucketUrl" -ForegroundColor White
    Write-Host "  Lambda Function: $lambdaFunction" -ForegroundColor White
    Write-Host ""

    # Test API endpoint
    Write-Host "🧪 Testing API endpoint..." -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "$apiEndpoint/photos" -Method GET -TimeoutSec 10
        Write-Host "✅ API is responding correctly" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  API test failed (this is normal for first deployment): $($_.Exception.Message)" -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "🔧 Next.js Configuration:" -ForegroundColor Cyan
    Write-Host "Add these to your Next.js .env.local file:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "NEXT_PUBLIC_PHOTO_API_URL=$apiEndpoint" -ForegroundColor Gray
    Write-Host "NEXT_PUBLIC_S3_BUCKET_URL=$bucketUrl" -ForegroundColor Gray
    Write-Host ""

    # Optionally create/update .env.local file
    $envPath = "../my-nextjs-site/.env.local"
    if (Test-Path $envPath) {
        Write-Host "📝 Updating existing .env.local file..." -ForegroundColor Yellow
        $envContent = Get-Content $envPath | Where-Object { 
            $_ -notmatch "^NEXT_PUBLIC_PHOTO_API_URL=" -and 
            $_ -notmatch "^NEXT_PUBLIC_S3_BUCKET_URL=" 
        }
        $envContent += "NEXT_PUBLIC_PHOTO_API_URL=$apiEndpoint"
        $envContent += "NEXT_PUBLIC_S3_BUCKET_URL=$bucketUrl"
        $envContent | Set-Content $envPath
        Write-Host "✅ Environment variables updated in .env.local" -ForegroundColor Green
    } else {
        Write-Host "📝 Creating .env.local file..." -ForegroundColor Yellow
        @(
            "# Photo API Configuration - Generated by deploy script",
            "# Generated on: $(Get-Date)",
            "NEXT_PUBLIC_PHOTO_API_URL=$apiEndpoint",
            "NEXT_PUBLIC_S3_BUCKET_URL=$bucketUrl"
        ) | Set-Content $envPath
        Write-Host "✅ Created .env.local file with environment variables" -ForegroundColor Green
    }

    Write-Host ""
    Write-Host "🎯 Useful Commands:" -ForegroundColor Cyan
    Write-Host "  Monitor stack: .\scripts\monitor-stack.ps1 -StackName $StackName -Region $Region" -ForegroundColor Gray
    Write-Host "  View logs: aws logs tail /aws/lambda/$lambdaFunction --follow --region $Region" -ForegroundColor Gray
    Write-Host "  Update stack: .\deploy-with-secrets.ps1 -StackName $StackName -Environment $Environment -Region $Region" -ForegroundColor Gray
    Write-Host "  Delete stack: aws cloudformation delete-stack --stack-name $StackName --region $Region" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🌐 AWS Console Links:" -ForegroundColor Cyan
    Write-Host "  CloudFormation: https://console.aws.amazon.com/cloudformation/home?region=$Region#/stacks/stackinfo?stackId=$StackName" -ForegroundColor Gray
    Write-Host "  Lambda: https://console.aws.amazon.com/lambda/home?region=$Region#/functions/$lambdaFunction" -ForegroundColor Gray
    Write-Host "  API Gateway: https://console.aws.amazon.com/apigateway/home?region=$Region" -ForegroundColor Gray
    Write-Host ""

} catch {
    Write-Host "⚠️  Deployment succeeded but failed to get outputs: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "💡 Check the AWS CloudFormation console for stack outputs." -ForegroundColor Yellow
}

Write-Host "🚀 Your photo backend is ready!" -ForegroundColor Green