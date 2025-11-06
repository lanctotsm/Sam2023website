# AWS Configuration Setup Script (PowerShell)
param(
    [string]$Region = "us-east-1",
    [string]$Environment = "dev"
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Function to write colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Function to check if AWS CLI is installed and configured
function Test-AwsCli {
    Write-Status "Checking AWS CLI installation..."
    
    try {
        aws --version | Out-Null
        Write-Success "AWS CLI is installed"
    } catch {
        Write-Error "AWS CLI is not installed. Please install it first."
        Write-Host "Download from: https://aws.amazon.com/cli/" -ForegroundColor Yellow
        exit 1
    }
    
    # Check if AWS is configured
    try {
        aws sts get-caller-identity | Out-Null
        Write-Success "AWS CLI is configured"
    } catch {
        Write-Error "AWS CLI is not configured. Please run 'aws configure' first."
        exit 1
    }
}

# Function to get AWS account information
function Get-AwsInfo {
    Write-Status "Gathering AWS account information..."
    
    $script:AwsAccountId = aws sts get-caller-identity --query Account --output text
    $script:AwsUserArn = aws sts get-caller-identity --query Arn --output text
    $script:AwsRegion = $Region
    
    Write-Success "AWS Account ID: $script:AwsAccountId"
    Write-Success "AWS User: $script:AwsUserArn"
    Write-Success "AWS Region: $script:AwsRegion"
}

# Function to check existing resources
function Test-ExistingResources {
    Write-Status "Checking for existing resources..."
    
    # Check for existing S3 buckets
    try {
        $existingBuckets = aws s3api list-buckets --query 'Buckets[?contains(Name, `photo`)].Name' --output text 2>$null
        if ($existingBuckets) {
            Write-Warning "Found existing photo-related S3 buckets:"
            Write-Host $existingBuckets -ForegroundColor Gray
        }
    } catch {
        # Ignore errors for this check
    }
    
    # Check for existing DynamoDB tables
    try {
        $existingTables = aws dynamodb list-tables --query 'TableNames[?contains(@, `photo`)]' --output text 2>$null
        if ($existingTables) {
            Write-Warning "Found existing photo-related DynamoDB tables:"
            Write-Host $existingTables -ForegroundColor Gray
        }
    } catch {
        # Ignore errors for this check
    }
    
    # Check for existing Lambda functions
    try {
        $existingFunctions = aws lambda list-functions --query 'Functions[?contains(FunctionName, `photo`)].FunctionName' --output text 2>$null
        if ($existingFunctions) {
            Write-Warning "Found existing photo-related Lambda functions:"
            Write-Host $existingFunctions -ForegroundColor Gray
        }
    } catch {
        # Ignore errors for this check
    }
}

# Function to generate KMS key
function New-KmsKey {
    param([string]$Environment)
    
    Write-Status "Generating KMS key for $Environment environment..."
    
    # Check if KMS key already exists
    $keyAlias = "alias/photo-backend-$Environment"
    try {
        $existingKey = aws kms describe-key --key-id $keyAlias --query 'KeyMetadata.KeyId' --output text 2>$null
        if ($existingKey -and $existingKey -ne "None") {
            Write-Success "Using existing KMS key: $existingKey"
            return $existingKey
        }
    } catch {
        # Key doesn't exist, create new one
    }
    
    # Create new KMS key
    try {
        $keyId = aws kms create-key --description "Photo Backend encryption key for $Environment" --query 'KeyMetadata.KeyId' --output text
        
        # Create alias
        aws kms create-alias --alias-name $keyAlias --target-key-id $keyId
        
        Write-Success "Created new KMS key: $keyId"
        return $keyId
    } catch {
        Write-Warning "Failed to create KMS key. Using default AWS managed key."
        return "alias/aws/s3"
    }
}

# Function to check Route53 hosted zones
function Test-Route53Zones {
    Write-Status "Checking Route53 hosted zones..."
    
    try {
        $hostedZones = aws route53 list-hosted-zones --query 'HostedZones[].{Name:Name,Id:Id}' --output table 2>$null
        if ($hostedZones) {
            Write-Success "Found Route53 hosted zones:"
            Write-Host $hostedZones -ForegroundColor Gray
        } else {
            Write-Warning "No Route53 hosted zones found"
        }
    } catch {
        Write-Warning "Could not check Route53 hosted zones"
    }
}

# Function to check ACM certificates
function Test-AcmCertificates {
    Write-Status "Checking ACM certificates..."
    
    try {
        $certificates = aws acm list-certificates --query 'CertificateSummaryList[].{Domain:DomainName,Arn:CertificateArn}' --output table 2>$null
        if ($certificates) {
            Write-Success "Found ACM certificates:"
            Write-Host $certificates -ForegroundColor Gray
        } else {
            Write-Warning "No ACM certificates found"
        }
    } catch {
        Write-Warning "Could not check ACM certificates"
    }
}

# Function to generate random hex string (replacement for openssl rand)
function New-RandomHex {
    param([int]$Length = 32)
    
    $bytes = New-Object byte[] $Length
    $rng = [System.Security.Cryptography.RNGCryptoServiceProvider]::new()
    $rng.GetBytes($bytes)
    $rng.Dispose()
    
    return [System.BitConverter]::ToString($bytes).Replace('-', '').ToLower()
}

# Function to generate secrets file
function New-SecretsFile {
    Write-Status "Generating secrets configuration file..."
    
    # Create config directory if it doesn't exist
    if (!(Test-Path "config")) {
        New-Item -ItemType Directory -Path "config" | Out-Null
    }
    
    # Generate encryption keys for dev and prod
    $devEncryptionKey = New-RandomHex -Length 32
    $prodEncryptionKey = New-RandomHex -Length 32
    
    # Generate KMS keys
    $devKmsKey = New-KmsKey -Environment "dev"
    $prodKmsKey = New-KmsKey -Environment "prod"
    
    # Create secrets file
    $secretsConfig = @{
        dev = @{
            DatabaseEncryptionKey = $devEncryptionKey
            S3KMSKeyId = if ($devKmsKey -like "alias/*") { $devKmsKey } else { "arn:aws:kms:$($script:AwsRegion):$($script:AwsAccountId):key/$devKmsKey" }
            NotificationEmail = "dev@yourdomain.com"
            CustomDomainName = ""
            CertificateArn = ""
            HostedZoneId = ""
        }
        prod = @{
            DatabaseEncryptionKey = $prodEncryptionKey
            S3KMSKeyId = if ($prodKmsKey -like "alias/*") { $prodKmsKey } else { "arn:aws:kms:$($script:AwsRegion):$($script:AwsAccountId):key/$prodKmsKey" }
            NotificationEmail = "admin@yourdomain.com"
            CustomDomainName = "api.yourdomain.com"
            CertificateArn = "arn:aws:acm:$($script:AwsRegion):$($script:AwsAccountId):certificate/REPLACE-WITH-YOUR-CERT-ID"
            HostedZoneId = "REPLACE-WITH-YOUR-HOSTED-ZONE-ID"
        }
    }
    
    $secretsConfig | ConvertTo-Json -Depth 3 | Set-Content "config/secrets.json"
    
    Write-Success "Created config/secrets.json"
    Write-Warning "Please update the domain-related values in config/secrets.json"
}

# Function to update gitignore
function Update-GitIgnore {
    Write-Status "Updating .gitignore file..."
    
    # Create .gitignore if it doesn't exist
    if (!(Test-Path ".gitignore")) {
        New-Item -ItemType File -Path ".gitignore" | Out-Null
    }
    
    # Check if secrets are already in gitignore
    $gitignoreContent = Get-Content ".gitignore" -ErrorAction SilentlyContinue
    if ($gitignoreContent -notcontains "config/secrets.json") {
        $additionalEntries = @(
            "",
            "# AWS Secrets and Configuration",
            "config/secrets.json",
            "*.pem",
            "*.key",
            ".aws/"
        )
        
        $additionalEntries | Add-Content ".gitignore"
        Write-Success "Added secrets to .gitignore"
    } else {
        Write-Success ".gitignore already contains secrets configuration"
    }
}

# Function to create deployment script
function New-DeploymentScript {
    Write-Status "Creating enhanced deployment script..."
    
    $deployScript = @'
# Enhanced deployment script with secrets management (PowerShell)
param(
    [string]$StackName = "photo-backend",
    [string]$Environment = "dev",
    [string]$Region = "us-east-1"
)

$ErrorActionPreference = "Stop"

Write-Host "Deploying photo backend with secrets..." -ForegroundColor Green
Write-Host "Stack Name: $StackName" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Cyan
Write-Host "Region: $Region" -ForegroundColor Cyan

# Check if secrets file exists
if (!(Test-Path "config/secrets.json")) {
    Write-Host "Error: config/secrets.json not found. Run setup-aws-config.ps1 first." -ForegroundColor Red
    exit 1
}

# Extract secrets for the environment
try {
    $secrets = Get-Content "config/secrets.json" | ConvertFrom-Json
    $envSecrets = $secrets.$Environment
    if (!$envSecrets) {
        Write-Host "Error: No secrets found for environment $Environment" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Error: Failed to parse secrets file" -ForegroundColor Red
    exit 1
}

# Build the application
Write-Host "Building Go binary..." -ForegroundColor Yellow
$env:GOOS = "linux"
$env:GOARCH = "amd64"
$env:CGO_ENABLED = "0"
go build -ldflags="-s -w" -o main .

# Deploy with SAM
Write-Host "Deploying with SAM..." -ForegroundColor Yellow
sam deploy `
    --template-file template.yaml `
    --stack-name $StackName `
    --parameter-overrides "file://config/environments/$Environment.json" `
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM `
    --region $Region `
    --no-confirm-changeset `
    --no-fail-on-empty-changeset

# Get outputs
Write-Host "Getting stack outputs..." -ForegroundColor Yellow
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
Write-Host "API Endpoint: $ApiEndpoint" -ForegroundColor White
Write-Host "S3 Bucket: $BucketName" -ForegroundColor White
Write-Host "S3 Bucket URL: $BucketUrl" -ForegroundColor White
Write-Host ""
Write-Host "Add these to your Next.js environment variables:" -ForegroundColor Yellow
Write-Host "NEXT_PUBLIC_PHOTO_API_URL=$ApiEndpoint" -ForegroundColor Gray
Write-Host "NEXT_PUBLIC_S3_BUCKET_URL=$BucketUrl" -ForegroundColor Gray
'@

    $deployScript | Set-Content "deploy-with-secrets.ps1"
    Write-Success "Created deploy-with-secrets.ps1"
}

# Function to create monitoring script
function New-MonitoringScript {
    Write-Status "Creating monitoring script..."
    
    # Create scripts directory if it doesn't exist
    if (!(Test-Path "scripts")) {
        New-Item -ItemType Directory -Path "scripts" | Out-Null
    }
    
    $monitorScript = @'
# Stack monitoring script (PowerShell)
param(
    [string]$StackName = "photo-backend-dev",
    [string]$Region = "us-east-1"
)

Write-Host "Monitoring stack: $StackName in region: $Region" -ForegroundColor Green

# Check stack status
Write-Host "=== Stack Status ===" -ForegroundColor Cyan
aws cloudformation describe-stacks `
    --stack-name $StackName `
    --region $Region `
    --query 'Stacks[0].StackStatus' `
    --output text

# Check recent events
Write-Host "=== Recent Events ===" -ForegroundColor Cyan
aws cloudformation describe-stack-events `
    --stack-name $StackName `
    --region $Region `
    --max-items 10 `
    --query 'StackEvents[].[Timestamp,LogicalResourceId,ResourceStatus,ResourceStatusReason]' `
    --output table

# Check Lambda function metrics
Write-Host "=== Lambda Metrics (Last 24 hours) ===" -ForegroundColor Cyan
$FunctionName = aws cloudformation describe-stack-resources `
    --stack-name $StackName `
    --region $Region `
    --query 'StackResources[?ResourceType==`AWS::Lambda::Function`].PhysicalResourceId' `
    --output text

if ($FunctionName) {
    $StartTime = (Get-Date).AddDays(-1).ToString("yyyy-MM-ddTHH:mm:ss")
    $EndTime = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
    
    aws cloudwatch get-metric-statistics `
        --namespace AWS/Lambda `
        --metric-name Invocations `
        --dimensions Name=FunctionName,Value=$FunctionName `
        --start-time $StartTime `
        --end-time $EndTime `
        --period 3600 `
        --statistics Sum `
        --region $Region `
        --query 'Datapoints[].{Time:Timestamp,Invocations:Sum}' `
        --output table
}
'@

    $monitorScript | Set-Content "scripts/monitor-stack.ps1"
    Write-Success "Created scripts/monitor-stack.ps1"
}

# Main execution
function Main {
    Write-Host "=== AWS Photo Backend Configuration Setup ===" -ForegroundColor Green
    Write-Host ""
    
    # Check prerequisites
    Test-AwsCli
    
    # Get AWS information
    Get-AwsInfo
    
    # Check existing resources
    Test-ExistingResources
    
    # Check Route53 and ACM
    Test-Route53Zones
    Test-AcmCertificates
    
    # Generate configuration files
    New-SecretsFile
    Update-GitIgnore
    New-DeploymentScript
    New-MonitoringScript
    
    Write-Host ""
    Write-Success "=== Setup Complete ==="
    Write-Host ""
    Write-Status "Next steps:"
    Write-Host "1. Review and update config/secrets.json with your domain information" -ForegroundColor Yellow
    Write-Host "2. Update config/environments/*.json with your specific requirements" -ForegroundColor Yellow
    Write-Host "3. Run .\deploy-with-secrets.ps1 to deploy your stack" -ForegroundColor Yellow
    Write-Host "4. Use .\scripts\monitor-stack.ps1 to monitor your deployment" -ForegroundColor Yellow
    Write-Host ""
    Write-Warning "Remember: config/secrets.json contains sensitive information and is excluded from git"
}

# Run main function
Main