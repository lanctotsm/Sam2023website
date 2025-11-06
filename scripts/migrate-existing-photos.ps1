# Photo Migration Script
# This script migrates existing photos to include album associations and user email

param(
    [Parameter(Mandatory=$true)]
    [string]$StackName,
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-east-1",
    
    [Parameter(Mandatory=$false)]
    [string]$DefaultAlbumName = "Default Album",
    
    [Parameter(Mandatory=$false)]
    [string]$UserEmail = "lanctotsm@gmail.com"
)

Write-Host "Starting photo migration for stack: $StackName" -ForegroundColor Green

# Get table names from CloudFormation stack
Write-Host "Getting table names from CloudFormation stack..." -ForegroundColor Yellow
try {
    $photoTableName = aws cloudformation describe-stacks --stack-name $StackName --region $Region --query "Stacks[0].Outputs[?OutputKey=='DynamoDBTableName'].OutputValue" --output text
    $albumsTableName = aws cloudformation describe-stacks --stack-name $StackName --region $Region --query "Stacks[0].Outputs[?OutputKey=='AlbumsTableName'].OutputValue" --output text
    
    if ([string]::IsNullOrEmpty($photoTableName) -or [string]::IsNullOrEmpty($albumsTableName)) {
        throw "Could not retrieve table names from CloudFormation stack"
    }
    
    Write-Host "Photo table: $photoTableName" -ForegroundColor Cyan
    Write-Host "Albums table: $albumsTableName" -ForegroundColor Cyan
} catch {
    Write-Host "Error getting table names: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Create default album
Write-Host "Creating default album..." -ForegroundColor Yellow
$defaultAlbumId = [System.Guid]::NewGuid().ToString()
$currentTime = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"

$albumItem = @{
    album_id = @{ S = $defaultAlbumId }
    user_email = @{ S = $UserEmail }
    name = @{ S = $DefaultAlbumName }
    photo_count = @{ N = "0" }
    created_at = @{ S = $currentTime }
    updated_at = @{ S = $currentTime }
} | ConvertTo-Json -Depth 3

try {
    aws dynamodb put-item --table-name $albumsTableName --item $albumItem --region $Region
    Write-Host "Default album created with ID: $defaultAlbumId" -ForegroundColor Green
} catch {
    Write-Host "Error creating default album: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Get all existing photos
Write-Host "Scanning existing photos..." -ForegroundColor Yellow
try {
    $scanResult = aws dynamodb scan --table-name $photoTableName --region $Region | ConvertFrom-Json
    $photos = $scanResult.Items
    Write-Host "Found $($photos.Count) existing photos" -ForegroundColor Cyan
} catch {
    Write-Host "Error scanning photos: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Update each photo with album association and user email
$updatedCount = 0
$errorCount = 0

foreach ($photo in $photos) {
    try {
        $photoId = $photo.id.S
        Write-Host "Updating photo: $photoId" -ForegroundColor Gray
        
        # Check if photo already has album_id and user_email
        $needsUpdate = $false
        $updateExpression = "SET "
        $expressionAttributeValues = @{}
        
        if (-not $photo.album_id) {
            $updateExpression += "album_id = :album_id, "
            $expressionAttributeValues[":album_id"] = @{ S = $defaultAlbumId }
            $needsUpdate = $true
        }
        
        if (-not $photo.user_email) {
            $updateExpression += "user_email = :user_email, "
            $expressionAttributeValues[":user_email"] = @{ S = $UserEmail }
            $needsUpdate = $true
        }
        
        if ($needsUpdate) {
            # Remove trailing comma and space
            $updateExpression = $updateExpression.TrimEnd(", ")
            
            $updateParams = @{
                TableName = $photoTableName
                Key = @{
                    id = @{ S = $photoId }
                }
                UpdateExpression = $updateExpression
                ExpressionAttributeValues = $expressionAttributeValues
            } | ConvertTo-Json -Depth 4
            
            aws dynamodb update-item --cli-input-json $updateParams --region $Region
            $updatedCount++
        } else {
            Write-Host "Photo $photoId already has required fields" -ForegroundColor Gray
        }
    } catch {
        Write-Host "Error updating photo $photoId : $($_.Exception.Message)" -ForegroundColor Red
        $errorCount++
    }
}

# Update album photo count
Write-Host "Updating album photo count..." -ForegroundColor Yellow
try {
    $updateAlbumParams = @{
        TableName = $albumsTableName
        Key = @{
            album_id = @{ S = $defaultAlbumId }
        }
        UpdateExpression = "SET photo_count = :count, updated_at = :updated_at"
        ExpressionAttributeValues = @{
            ":count" = @{ N = $updatedCount.ToString() }
            ":updated_at" = @{ S = $currentTime }
        }
    } | ConvertTo-Json -Depth 4
    
    aws dynamodb update-item --cli-input-json $updateAlbumParams --region $Region
    Write-Host "Album photo count updated to: $updatedCount" -ForegroundColor Green
} catch {
    Write-Host "Error updating album photo count: $($_.Exception.Message)" -ForegroundColor Red
}

# Summary
Write-Host "`nMigration Summary:" -ForegroundColor Green
Write-Host "- Total photos found: $($photos.Count)" -ForegroundColor Cyan
Write-Host "- Photos updated: $updatedCount" -ForegroundColor Cyan
Write-Host "- Errors: $errorCount" -ForegroundColor Cyan
Write-Host "- Default album ID: $defaultAlbumId" -ForegroundColor Cyan

if ($errorCount -eq 0) {
    Write-Host "`nMigration completed successfully!" -ForegroundColor Green
} else {
    Write-Host "`nMigration completed with $errorCount errors. Please check the logs above." -ForegroundColor Yellow
}