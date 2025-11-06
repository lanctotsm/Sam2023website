# Database Initialization Script
# This script initializes the database tables and creates necessary indexes

param(
    [Parameter(Mandatory=$true)]
    [string]$StackName,
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-east-1"
)

Write-Host "Initializing database for stack: $StackName" -ForegroundColor Green

# Get table names from CloudFormation stack
Write-Host "Getting table names from CloudFormation stack..." -ForegroundColor Yellow
try {
    $photoTableName = aws cloudformation describe-stacks --stack-name $StackName --region $Region --query "Stacks[0].Outputs[?OutputKey=='DynamoDBTableName'].OutputValue" --output text
    $albumsTableName = aws cloudformation describe-stacks --stack-name $StackName --region $Region --query "Stacks[0].Outputs[?OutputKey=='AlbumsTableName'].OutputValue" --output text
    $sessionsTableName = aws cloudformation describe-stacks --stack-name $StackName --region $Region --query "Stacks[0].Outputs[?OutputKey=='SessionsTableName'].OutputValue" --output text
    
    if ([string]::IsNullOrEmpty($photoTableName) -or [string]::IsNullOrEmpty($albumsTableName) -or [string]::IsNullOrEmpty($sessionsTableName)) {
        throw "Could not retrieve table names from CloudFormation stack"
    }
    
    Write-Host "Photo table: $photoTableName" -ForegroundColor Cyan
    Write-Host "Albums table: $albumsTableName" -ForegroundColor Cyan
    Write-Host "Sessions table: $sessionsTableName" -ForegroundColor Cyan
} catch {
    Write-Host "Error getting table names: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Function to check table status
function Wait-ForTableActive {
    param([string]$TableName, [string]$Region)
    
    Write-Host "Waiting for table $TableName to become active..." -ForegroundColor Yellow
    do {
        Start-Sleep -Seconds 5
        $status = aws dynamodb describe-table --table-name $TableName --region $Region --query "Table.TableStatus" --output text
        Write-Host "Table status: $status" -ForegroundColor Gray
    } while ($status -ne "ACTIVE")
    Write-Host "Table $TableName is now active" -ForegroundColor Green
}

# Check all tables are active
Write-Host "Checking table status..." -ForegroundColor Yellow
try {
    Wait-ForTableActive -TableName $photoTableName -Region $Region
    Wait-ForTableActive -TableName $albumsTableName -Region $Region
    Wait-ForTableActive -TableName $sessionsTableName -Region $Region
} catch {
    Write-Host "Error checking table status: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Verify Global Secondary Indexes
Write-Host "Verifying Global Secondary Indexes..." -ForegroundColor Yellow

# Check Photos table GSIs
try {
    $photoTableGSIs = aws dynamodb describe-table --table-name $photoTableName --region $Region --query "Table.GlobalSecondaryIndexes[].IndexName" --output text
    Write-Host "Photos table GSIs: $photoTableGSIs" -ForegroundColor Cyan
    
    $expectedPhotoGSIs = @("UploadedAtIndex", "album_id-uploaded_at-index", "user_email-uploaded_at-index")
    foreach ($expectedGSI in $expectedPhotoGSIs) {
        if ($photoTableGSIs -notlike "*$expectedGSI*") {
            Write-Host "Warning: Expected GSI '$expectedGSI' not found in Photos table" -ForegroundColor Yellow
        } else {
            Write-Host "✓ GSI '$expectedGSI' found in Photos table" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "Error checking Photos table GSIs: $($_.Exception.Message)" -ForegroundColor Red
}

# Check Albums table GSIs
try {
    $albumsTableGSIs = aws dynamodb describe-table --table-name $albumsTableName --region $Region --query "Table.GlobalSecondaryIndexes[].IndexName" --output text
    Write-Host "Albums table GSIs: $albumsTableGSIs" -ForegroundColor Cyan
    
    $expectedAlbumsGSIs = @("user_email-created_at-index")
    foreach ($expectedGSI in $expectedAlbumsGSIs) {
        if ($albumsTableGSIs -notlike "*$expectedGSI*") {
            Write-Host "Warning: Expected GSI '$expectedGSI' not found in Albums table" -ForegroundColor Yellow
        } else {
            Write-Host "✓ GSI '$expectedGSI' found in Albums table" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "Error checking Albums table GSIs: $($_.Exception.Message)" -ForegroundColor Red
}

# Check Sessions table GSIs
try {
    $sessionsTableGSIs = aws dynamodb describe-table --table-name $sessionsTableName --region $Region --query "Table.GlobalSecondaryIndexes[].IndexName" --output text
    Write-Host "Sessions table GSIs: $sessionsTableGSIs" -ForegroundColor Cyan
    
    $expectedSessionsGSIs = @("user_email-created_at-index")
    foreach ($expectedGSI in $expectedSessionsGSIs) {
        if ($sessionsTableGSIs -notlike "*$expectedGSI*") {
            Write-Host "Warning: Expected GSI '$expectedGSI' not found in Sessions table" -ForegroundColor Yellow
        } else {
            Write-Host "✓ GSI '$expectedGSI' found in Sessions table" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "Error checking Sessions table GSIs: $($_.Exception.Message)" -ForegroundColor Red
}

# Verify TTL is enabled on Sessions table
Write-Host "Verifying TTL configuration on Sessions table..." -ForegroundColor Yellow
try {
    $ttlStatus = aws dynamodb describe-time-to-live --table-name $sessionsTableName --region $Region --query "TimeToLiveDescription.TimeToLiveStatus" --output text
    if ($ttlStatus -eq "ENABLED") {
        Write-Host "✓ TTL is enabled on Sessions table" -ForegroundColor Green
    } else {
        Write-Host "Warning: TTL is not enabled on Sessions table (Status: $ttlStatus)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error checking TTL status: $($_.Exception.Message)" -ForegroundColor Red
}

# Test basic table operations
Write-Host "Testing basic table operations..." -ForegroundColor Yellow

# Test Sessions table
try {
    $testSessionId = [System.Guid]::NewGuid().ToString()
    $testItem = @{
        session_token = @{ S = $testSessionId }
        user_email = @{ S = "test@example.com" }
        created_at = @{ S = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ") }
        expires_at = @{ N = ([DateTimeOffset]::UtcNow.AddHours(1).ToUnixTimeSeconds()).ToString() }
    } | ConvertTo-Json -Depth 3
    
    aws dynamodb put-item --table-name $sessionsTableName --item $testItem --region $Region
    aws dynamodb delete-item --table-name $sessionsTableName --key "{`"session_token`": {`"S`": `"$testSessionId`"}}" --region $Region
    Write-Host "✓ Sessions table read/write test passed" -ForegroundColor Green
} catch {
    Write-Host "Error testing Sessions table: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Albums table
try {
    $testAlbumId = [System.Guid]::NewGuid().ToString()
    $testItem = @{
        album_id = @{ S = $testAlbumId }
        user_email = @{ S = "test@example.com" }
        name = @{ S = "Test Album" }
        photo_count = @{ N = "0" }
        created_at = @{ S = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ") }
        updated_at = @{ S = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ") }
    } | ConvertTo-Json -Depth 3
    
    aws dynamodb put-item --table-name $albumsTableName --item $testItem --region $Region
    aws dynamodb delete-item --table-name $albumsTableName --key "{`"album_id`": {`"S`": `"$testAlbumId`"}}" --region $Region
    Write-Host "✓ Albums table read/write test passed" -ForegroundColor Green
} catch {
    Write-Host "Error testing Albums table: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nDatabase initialization completed successfully!" -ForegroundColor Green
Write-Host "All tables are active and ready for use." -ForegroundColor Cyan