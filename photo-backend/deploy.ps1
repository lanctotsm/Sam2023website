# Photo Backend Deployment Script (PowerShell)
param(
    [string]$StackName = "photo-backend",
    [string]$Environment = "dev",
    [string]$Region = "us-east-1"
)

# Set error action preference
$ErrorActionPreference = "Stop"

Write-Host "Deploying photo backend..." -ForegroundColor Green
Write-Host "Stack Name: $StackName" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Cyan
Write-Host "Region: $Region" -ForegroundColor Cyan

# Check if AWS CLI is installed
try {
    aws --version | Out-Null
    Write-Host "✓ AWS CLI is installed" -ForegroundColor Green
} catch {
    Write-Host "✗ AWS CLI is not installed. Please install it first." -ForegroundColor Red
    Write-Host "Download from: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    exit 1
}

# Check if SAM CLI is installed
try {
    sam --version | Out-Null
    Write-Host "✓ SAM CLI is installed" -ForegroundColor Green
} catch {
    Write-Host "✗ SAM CLI is not installed. Please install it first." -ForegroundColor Red
    Write-Host "Install with: pip install aws-sam-cli" -ForegroundColor Yellow
    exit 1
}

# Check if Go is installed
try {
    go version | Out-Null
    Write-Host "✓ Go is installed" -ForegroundColor Green
} catch {
    Write-Host "✗ Go is not installed. Please install it first." -ForegroundColor Red
    Write-Host "Download from: https://golang.org/dl/" -ForegroundColor Yellow
    exit 1
}

# Build the Go binary
Write-Host "Building Go binary..." -ForegroundColor Yellow
$env:GOOS = "linux"
$env:GOARCH = "amd64"
$env:CGO_ENABLED = "0"

try {
    go build -ldflags="-s -w" -o main .
    Write-Host "✓ Go binary built successfully" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to build Go binary" -ForegroundColor Red
    exit 1
}

# Deploy with SAM
Write-Host "Deploying with SAM..." -ForegroundColor Yellow
try {
    sam deploy `
        --template-file template.yaml `
        --stack-name $StackName `
        --parameter-overrides "file://config/environments/$Environment.json" `
        --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM `
        --region $Region `
        --no-confirm-changeset `
        --no-fail-on-empty-changeset

    Write-Host "✓ SAM deployment completed" -ForegroundColor Green
} catch {
    Write-Host "✗ SAM deployment failed" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Get outputs
Write-Host "Getting stack outputs..." -ForegroundColor Yellow
try {
    $ApiEndpoint = aws cloudformation describe-stacks `
        --stack-name $StackName `
        --region $Region `
        --query 'Stacks[0].Outputs[?OutputKey==`PhotoAPIEndpoint`].OutputValue' `
        --output text

    $BucketName = aws cloudformation describe-stacks `
        --stack-name $StackName `
        --region $Region `
        --query 'Stacks[0].Outputs[?OutputKey==`PhotoBucketName`].OutputValue' `
        --output text

    $BucketUrl = aws cloudformation describe-stacks `
        --stack-name $StackName `
        --region $Region `
        --query 'Stacks[0].Outputs[?OutputKey==`PhotoBucketURL`].OutputValue' `
        --output text

    Write-Host ""
    Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Stack Outputs:" -ForegroundColor Cyan
    Write-Host "API Endpoint: $ApiEndpoint" -ForegroundColor White
    Write-Host "S3 Bucket: $BucketName" -ForegroundColor White
    Write-Host "S3 Bucket URL: $BucketUrl" -ForegroundColor White
    Write-Host ""
    Write-Host "🔧 Add these to your Next.js .env.local file:" -ForegroundColor Yellow
    Write-Host "NEXT_PUBLIC_PHOTO_API_URL=$ApiEndpoint" -ForegroundColor Gray
    Write-Host "NEXT_PUBLIC_S3_BUCKET_URL=$BucketUrl" -ForegroundColor Gray
    Write-Host ""

    # Optionally create/update .env.local file
    $envPath = "../my-nextjs-site/.env.local"
    if (Test-Path $envPath) {
        Write-Host "📝 Updating existing .env.local file..." -ForegroundColor Yellow
        $envContent = Get-Content $envPath
        $envContent = $envContent | Where-Object { $_ -notmatch "^NEXT_PUBLIC_PHOTO_API_URL=" -and $_ -notmatch "^NEXT_PUBLIC_S3_BUCKET_URL=" }
        $envContent += "NEXT_PUBLIC_PHOTO_API_URL=$ApiEndpoint"
        $envContent += "NEXT_PUBLIC_S3_BUCKET_URL=$BucketUrl"
        $envContent | Set-Content $envPath
    } else {
        Write-Host "📝 Creating .env.local file..." -ForegroundColor Yellow
        @(
            "# Photo API Configuration",
            "NEXT_PUBLIC_PHOTO_API_URL=$ApiEndpoint",
            "NEXT_PUBLIC_S3_BUCKET_URL=$BucketUrl"
        ) | Set-Content $envPath
    }
    Write-Host "✓ Environment variables updated" -ForegroundColor Green

} catch {
    Write-Host "⚠️  Deployment succeeded but failed to get outputs" -ForegroundColor Yellow
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "🚀 Your photo backend is ready!" -ForegroundColor Green