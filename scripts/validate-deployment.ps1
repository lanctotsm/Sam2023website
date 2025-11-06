# Deployment Validation Script
# This script validates that the photo backend deployment is working correctly

param(
    [Parameter(Mandatory=$true)]
    [string]$StackName,
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-east-1"
)

Write-Host "Validating deployment for stack: $StackName" -ForegroundColor Green

# Get API endpoint from CloudFormation stack
Write-Host "Getting API endpoint from CloudFormation stack..." -ForegroundColor Yellow
try {
    $apiEndpoint = aws cloudformation describe-stacks --stack-name $StackName --region $Region --query "Stacks[0].Outputs[?OutputKey=='PhotoAPIEndpoint'].OutputValue" --output text
    
    if ([string]::IsNullOrEmpty($apiEndpoint)) {
        throw "Could not retrieve API endpoint from CloudFormation stack"
    }
    
    Write-Host "API Endpoint: $apiEndpoint" -ForegroundColor Cyan
} catch {
    Write-Host "Error getting API endpoint: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Function to test HTTP endpoint
function Test-Endpoint {
    param(
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [string]$Body = $null,
        [string]$Description
    )
    
    Write-Host "Testing: $Description" -ForegroundColor Yellow
    Write-Host "URL: $Url" -ForegroundColor Gray
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
            UseBasicParsing = $true
        }
        
        if ($Body) {
            $params.Body = $Body
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params
        Write-Host "✓ Status: $($response.StatusCode) - $Description" -ForegroundColor Green
        return $response
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode) {
            Write-Host "✓ Status: $statusCode - $Description (Expected error)" -ForegroundColor Yellow
        } else {
            Write-Host "✗ Error: $($_.Exception.Message) - $Description" -ForegroundColor Red
        }
        return $null
    }
}

# Test basic API connectivity
Write-Host "`n=== Testing Basic API Connectivity ===" -ForegroundColor Magenta

# Test health check (if available) or any public endpoint
Test-Endpoint -Url "$apiEndpoint/photos" -Description "Photos endpoint (should return 401 for unauthenticated)"

# Test authentication endpoints
Write-Host "`n=== Testing Authentication Endpoints ===" -ForegroundColor Magenta

Test-Endpoint -Url "$apiEndpoint/auth/login" -Description "OAuth login endpoint"
Test-Endpoint -Url "$apiEndpoint/auth/status" -Description "Auth status endpoint (should return 401)"

# Test album endpoints (should require authentication)
Write-Host "`n=== Testing Album Endpoints ===" -ForegroundColor Magenta

Test-Endpoint -Url "$apiEndpoint/albums" -Description "Albums list endpoint (should return 401)"
Test-Endpoint -Url "$apiEndpoint/albums" -Method "POST" -Body '{"name":"Test Album"}' -Description "Album creation endpoint (should return 401)"

# Validate CloudFormation stack resources
Write-Host "`n=== Validating CloudFormation Resources ===" -ForegroundColor Magenta

try {
    # Check stack status
    $stackStatus = aws cloudformation describe-stacks --stack-name $StackName --region $Region --query "Stacks[0].StackStatus" --output text
    Write-Host "Stack Status: $stackStatus" -ForegroundColor Cyan
    
    if ($stackStatus -ne "CREATE_COMPLETE" -and $stackStatus -ne "UPDATE_COMPLETE") {
        Write-Host "Warning: Stack is not in a complete state" -ForegroundColor Yellow
    } else {
        Write-Host "✓ Stack is in a healthy state" -ForegroundColor Green
    }
    
    # Check Lambda function
    $lambdaName = aws cloudformation describe-stacks --stack-name $StackName --region $Region --query "Stacks[0].Outputs[?OutputKey=='LambdaFunctionName'].OutputValue" --output text
    if ($lambdaName) {
        $lambdaStatus = aws lambda get-function --function-name $lambdaName --region $Region --query "Configuration.State" --output text
        Write-Host "Lambda Function Status: $lambdaStatus" -ForegroundColor Cyan
        
        if ($lambdaStatus -eq "Active") {
            Write-Host "✓ Lambda function is active" -ForegroundColor Green
        } else {
            Write-Host "Warning: Lambda function is not active" -ForegroundColor Yellow
        }
    }
    
    # Check DynamoDB tables
    $photoTableName = aws cloudformation describe-stacks --stack-name $StackName --region $Region --query "Stacks[0].Outputs[?OutputKey=='DynamoDBTableName'].OutputValue" --output text
    $albumsTableName = aws cloudformation describe-stacks --stack-name $StackName --region $Region --query "Stacks[0].Outputs[?OutputKey=='AlbumsTableName'].OutputValue" --output text
    $sessionsTableName = aws cloudformation describe-stacks --stack-name $StackName --region $Region --query "Stacks[0].Outputs[?OutputKey=='SessionsTableName'].OutputValue" --output text
    
    $tables = @($photoTableName, $albumsTableName, $sessionsTableName)
    foreach ($table in $tables) {
        if ($table) {
            $tableStatus = aws dynamodb describe-table --table-name $table --region $Region --query "Table.TableStatus" --output text
            Write-Host "Table $table Status: $tableStatus" -ForegroundColor Cyan
            
            if ($tableStatus -eq "ACTIVE") {
                Write-Host "✓ Table $table is active" -ForegroundColor Green
            } else {
                Write-Host "Warning: Table $table is not active" -ForegroundColor Yellow
            }
        }
    }
    
    # Check S3 bucket
    $bucketName = aws cloudformation describe-stacks --stack-name $StackName --region $Region --query "Stacks[0].Outputs[?OutputKey=='PhotoBucketName'].OutputValue" --output text
    if ($bucketName) {
        $bucketExists = aws s3api head-bucket --bucket $bucketName --region $Region 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ S3 bucket $bucketName exists and is accessible" -ForegroundColor Green
        } else {
            Write-Host "Warning: S3 bucket $bucketName may not be accessible" -ForegroundColor Yellow
        }
    }
    
} catch {
    Write-Host "Error validating CloudFormation resources: $($_.Exception.Message)" -ForegroundColor Red
}

# Check environment variables
Write-Host "`n=== Validating Environment Configuration ===" -ForegroundColor Magenta

try {
    if ($lambdaName) {
        $envVars = aws lambda get-function-configuration --function-name $lambdaName --region $Region --query "Environment.Variables" | ConvertFrom-Json
        
        $requiredVars = @(
            "S3_BUCKET",
            "DYNAMODB_TABLE", 
            "SESSIONS_TABLE",
            "ALBUMS_TABLE",
            "GOOGLE_OAUTH_CLIENT_ID",
            "GOOGLE_OAUTH_CLIENT_SECRET",
            "GOOGLE_OAUTH_REDIRECT_URL",
            "AUTHORIZED_USER_EMAIL"
        )
        
        foreach ($var in $requiredVars) {
            if ($envVars.$var) {
                Write-Host "✓ Environment variable $var is set" -ForegroundColor Green
            } else {
                Write-Host "✗ Environment variable $var is missing" -ForegroundColor Red
            }
        }
    }
} catch {
    Write-Host "Error checking environment variables: $($_.Exception.Message)" -ForegroundColor Red
}

# Summary
Write-Host "`n=== Validation Summary ===" -ForegroundColor Magenta
Write-Host "API Endpoint: $apiEndpoint" -ForegroundColor Cyan
Write-Host "Stack Status: $stackStatus" -ForegroundColor Cyan

Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "1. Configure Google OAuth credentials in your secrets.json file" -ForegroundColor White
Write-Host "2. Run the database initialization script: .\scripts\initialize-database.ps1 -StackName $StackName" -ForegroundColor White
Write-Host "3. If you have existing photos, run: .\scripts\migrate-existing-photos.ps1 -StackName $StackName -UserEmail <your-email>" -ForegroundColor White
Write-Host "4. Test the OAuth flow by visiting: $apiEndpoint/auth/login" -ForegroundColor White

Write-Host "`nDeployment validation completed!" -ForegroundColor Green