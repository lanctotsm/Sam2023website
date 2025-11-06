# Complete Deployment Script with Authentication
# This script deploys the photo backend with OAuth authentication support

param(
    [Parameter(Mandatory=$true)]
    [string]$StackName,
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-east-1",
    
    [Parameter(Mandatory=$false)]
    [string]$SecretsFile = "config/secrets.json",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipMigration,
    
    [Parameter(Mandatory=$false)]
    [switch]$ValidateOnly
)

$ErrorActionPreference = "Stop"

Write-Host "Photo Backend Deployment with Authentication" -ForegroundColor Green
Write-Host "Stack Name: $StackName" -ForegroundColor Cyan
Write-Host "Region: $Region" -ForegroundColor Cyan
Write-Host "Secrets File: $SecretsFile" -ForegroundColor Cyan

# Check prerequisites
Write-Host "`n=== Checking Prerequisites ===" -ForegroundColor Magenta

# Check if AWS CLI is installed
try {
    aws --version | Out-Null
    Write-Host "✓ AWS CLI is installed" -ForegroundColor Green
} catch {
    Write-Host "✗ AWS CLI is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check if SAM CLI is installed
try {
    sam --version | Out-Null
    Write-Host "✓ SAM CLI is installed" -ForegroundColor Green
} catch {
    Write-Host "✗ SAM CLI is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check if Go is installed
try {
    go version | Out-Null
    Write-Host "✓ Go is installed" -ForegroundColor Green
} catch {
    Write-Host "✗ Go is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check if secrets file exists
if (Test-Path $SecretsFile) {
    Write-Host "✓ Secrets file found: $SecretsFile" -ForegroundColor Green
    try {
        $secrets = Get-Content $SecretsFile | ConvertFrom-Json
        Write-Host "✓ Secrets file is valid JSON" -ForegroundColor Green
    } catch {
        Write-Host "✗ Secrets file is not valid JSON" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✗ Secrets file not found: $SecretsFile" -ForegroundColor Red
    Write-Host "Please create the secrets file based on config/secrets.example.json" -ForegroundColor Yellow
    exit 1
}

# Validate required secrets
$requiredSecrets = @(
    "GoogleOAuthClientId",
    "GoogleOAuthClientSecret", 
    "GoogleOAuthRedirectURL",
    "AuthorizedUserEmail"
)

foreach ($secret in $requiredSecrets) {
    if (-not $secrets.$secret -or $secrets.$secret -eq "your-$($secret.ToLower())-here") {
        Write-Host "✗ Required secret '$secret' is missing or not configured" -ForegroundColor Red
        exit 1
    } else {
        Write-Host "✓ Secret '$secret' is configured" -ForegroundColor Green
    }
}

if ($ValidateOnly) {
    Write-Host "`nValidation completed successfully!" -ForegroundColor Green
    exit 0
}

# Build the Go application
Write-Host "`n=== Building Application ===" -ForegroundColor Magenta
try {
    Set-Location photo-backend
    Write-Host "Building Go application..." -ForegroundColor Yellow
    go mod tidy
    go build -o main main.go
    Write-Host "✓ Application built successfully" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to build application: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    Set-Location ..
}

# Deploy with SAM
Write-Host "`n=== Deploying with SAM ===" -ForegroundColor Magenta
try {
    Set-Location photo-backend
    
    $samParams = @(
        "deploy",
        "--stack-name", $StackName,
        "--region", $Region,
        "--capabilities", "CAPABILITY_IAM",
        "--parameter-overrides",
        "GoogleOAuthClientId=$($secrets.GoogleOAuthClientId)",
        "GoogleOAuthClientSecret=$($secrets.GoogleOAuthClientSecret)",
        "GoogleOAuthRedirectURL=$($secrets.GoogleOAuthRedirectURL)",
        "AuthorizedUserEmail=$($secrets.AuthorizedUserEmail)"
    )
    
    # Add optional parameters if they exist in secrets
    if ($secrets.SessionTimeoutHours) {
        $samParams += "SessionTimeoutHours=$($secrets.SessionTimeoutHours)"
    }
    if ($secrets.NotificationEmail) {
        $samParams += "NotificationEmail=$($secrets.NotificationEmail)"
    }
    if ($secrets.EnableEncryption) {
        $samParams += "EnableEncryption=$($secrets.EnableEncryption)"
    }
    if ($secrets.EnableXRay) {
        $samParams += "EnableXRay=$($secrets.EnableXRay)"
    }
    
    Write-Host "Deploying stack..." -ForegroundColor Yellow
    & sam @samParams
    
    if ($LASTEXITCODE -ne 0) {
        throw "SAM deployment failed"
    }
    
    Write-Host "✓ Stack deployed successfully" -ForegroundColor Green
} catch {
    Write-Host "✗ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    Set-Location ..
}

# Initialize database
Write-Host "`n=== Initializing Database ===" -ForegroundColor Magenta
try {
    & .\scripts\initialize-database.ps1 -StackName $StackName -Region $Region
    Write-Host "✓ Database initialized successfully" -ForegroundColor Green
} catch {
    Write-Host "✗ Database initialization failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "You may need to run the initialization script manually later" -ForegroundColor Yellow
}

# Migrate existing photos (if not skipped)
if (-not $SkipMigration) {
    Write-Host "`n=== Migrating Existing Photos ===" -ForegroundColor Magenta
    try {
        & .\scripts\migrate-existing-photos.ps1 -StackName $StackName -Region $Region -UserEmail $secrets.AuthorizedUserEmail
        Write-Host "✓ Photo migration completed successfully" -ForegroundColor Green
    } catch {
        Write-Host "✗ Photo migration failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "You may need to run the migration script manually later" -ForegroundColor Yellow
    }
} else {
    Write-Host "`nSkipping photo migration (use -SkipMigration:$false to enable)" -ForegroundColor Yellow
}

# Validate deployment
Write-Host "`n=== Validating Deployment ===" -ForegroundColor Magenta
try {
    & .\scripts\validate-deployment.ps1 -StackName $StackName -Region $Region
    Write-Host "✓ Deployment validation completed" -ForegroundColor Green
} catch {
    Write-Host "✗ Deployment validation failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "The deployment may still be functional, but some issues were detected" -ForegroundColor Yellow
}

# Get final outputs
Write-Host "`n=== Deployment Complete ===" -ForegroundColor Green
try {
    $apiEndpoint = aws cloudformation describe-stacks --stack-name $StackName --region $Region --query "Stacks[0].Outputs[?OutputKey=='PhotoAPIEndpoint'].OutputValue" --output text
    Write-Host "API Endpoint: $apiEndpoint" -ForegroundColor Cyan
    Write-Host "OAuth Login URL: $apiEndpoint/auth/login" -ForegroundColor Cyan
    Write-Host "Authorized User: $($secrets.AuthorizedUserEmail)" -ForegroundColor Cyan
} catch {
    Write-Host "Could not retrieve API endpoint from stack outputs" -ForegroundColor Yellow
}

Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "1. Test the OAuth flow by visiting the login URL above" -ForegroundColor White
Write-Host "2. Ensure your Google OAuth configuration matches the redirect URL" -ForegroundColor White
Write-Host "3. Update your frontend application to use the new authentication endpoints" -ForegroundColor White
Write-Host "4. Test photo upload and album management functionality" -ForegroundColor White

Write-Host "`nDeployment completed successfully! 🎉" -ForegroundColor Green