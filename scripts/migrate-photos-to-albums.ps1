# Photo Migration Script - Migrate existing photos to album structure
# This script creates a default album and associates all existing photos with it

param(
    [Parameter(Mandatory=$true)]
    [string]$Environment,
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-east-1",
    
    [Parameter(Mandatory=$false)]
    [string]$StackName = "photo-backend",
    
    [Parameter(Mandatory=$false)]
    [string]$DefaultAlbumName = "Legacy Photos"
)

Write-Host "Starting photo migration for environment: $Environment" -ForegroundColor Green

# Get table names from CloudFormation stack
$PhotoTableName = "${StackName}-photo-metadata-${Environment}"
$AlbumsTableName = "${StackName}-albums-${Environment}"
$SessionsTableName = "${StackName}-sessions-${Environment}"

Write-Host "Using tables:" -ForegroundColor Yellow
Write-Host "  Photos: $PhotoTableName" -ForegroundColor Yellow
Write-Host "  Albums: $AlbumsTableName" -ForegroundColor Yellow
Write-Host "  Sessions: $SessionsTableName" -ForegroundColor Yellow

# Check if tables exist
Write-Host "Checking if DynamoDB tables exist..." -ForegroundColor Blue

try {
    $photoTable = aws dynamodb describe-table --table-name $PhotoTableName --region $Region 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Photo table $PhotoTableName does not exist" -ForegroundColor Red
        exit 1
    }
    
    $albumsTable = aws dynamodb describe-table --table-name $AlbumsTableName --region $Region 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Albums table $AlbumsTableName does not exist" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "All tables exist" -ForegroundColor Green
} catch {
    Write-Host "Error checking tables: $_" -ForegroundColor Red
    exit 1
}

# Generate default album ID
$DefaultAlbumId = [System.Guid]::NewGuid().ToString()
$AuthorizedUserEmail = "lanctotsm@gmail.com"
$CurrentTime = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"

Write-Host "Creating default album: $DefaultAlbumName (ID: $DefaultAlbumId)" -ForegroundColor Blue

# Create default album
$albumItem = @{
    "album_id" = @{ "S" = $DefaultAlbumId }
    "user_email" = @{ "S" = $AuthorizedUserEmail }
    "name" = @{ "S" = $DefaultAlbumName }
    "photo_count" = @{ "N" = "0" }
    "created_at" = @{ "S" = $CurrentTime }
    "updated_at" = @{ "S" = $CurrentTime }
} | ConvertTo-Json -Depth 10 -Compress

try {
    aws dynamodb put-item --table-name $AlbumsTableName --item $albumItem --region $Region
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Default album created successfully" -ForegroundColor Green
    } else {
        Write-Host "Error creating default album" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Error creating album: $_" -ForegroundColor Red
    exit 1
}

# Scan existing photos
Write-Host "Scanning existing photos..." -ForegroundColor Blue

try {
    $scanResult = aws dynamodb scan --table-name $PhotoTableName --region $Region | ConvertFrom-Json
    $photos = $scanResult.Items
    $photoCount = $photos.Count
    
    Write-Host "Found $photoCount existing photos" -ForegroundColor Yellow
    
    if ($photoCount -eq 0) {
        Write-Host "No photos to migrate" -ForegroundColor Green
        exit 0
    }
} catch {
    Write-Host "Error scanning photos: $_" -ForegroundColor Red
    exit 1
}

# Update photos with album association
Write-Host "Updating photos with album association..." -ForegroundColor Blue
$updatedCount = 0
$errorCount = 0

foreach ($photo in $photos) {
    $photoId = $photo.id.S
    
    # Check if photo already has album_id
    if ($photo.PSObject.Properties.Name -contains "album_id") {
        Write-Host "Photo $photoId already has album association, skipping" -ForegroundColor Yellow
        continue
    }
    
    # Update photo with album_id and user_email
    $updateExpression = "SET album_id = :albumId, user_email = :userEmail"
    $expressionValues = @{
        ":albumId" = @{ "S" = $DefaultAlbumId }
        ":userEmail" = @{ "S" = $AuthorizedUserEmail }
    } | ConvertTo-Json -Depth 10 -Compress
    
    try {
        aws dynamodb update-item --table-name $PhotoTableName --key "{`"id`": {`"S`": `"$photoId`"}}" --update-expression $updateExpression --expression-attribute-values $expressionValues --region $Region
        
        if ($LASTEXITCODE -eq 0) {
            $updatedCount++
            Write-Host "Updated photo: $photoId" -ForegroundColor Green
        } else {
            $errorCount++
            Write-Host "Error updating photo: $photoId" -ForegroundColor Red
        }
    } catch {
        $errorCount++
        Write-Host "Error updating photo $photoId : $_" -ForegroundColor Red
    }
}

# Update album photo count
Write-Host "Updating album photo count..." -ForegroundColor Blue

try {
    $updateExpression = "SET photo_count = :count, updated_at = :updatedAt"
    $expressionValues = @{
        ":count" = @{ "N" = $updatedCount.ToString() }
        ":updatedAt" = @{ "S" = $CurrentTime }
    } | ConvertTo-Json -Depth 10 -Compress
    
    aws dynamodb update-item --table-name $AlbumsTableName --key "{`"album_id`": {`"S`": `"$DefaultAlbumId`"}}" --update-expression $updateExpression --expression-attribute-values $expressionValues --region $Region
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Album photo count updated successfully" -ForegroundColor Green
    } else {
        Write-Host "Error updating album photo count" -ForegroundColor Red
    }
} catch {
    Write-Host "Error updating album count: $_" -ForegroundColor Red
}

# Migration summary
Write-Host "`nMigration Summary:" -ForegroundColor Cyan
Write-Host "  Total photos found: $photoCount" -ForegroundColor White
Write-Host "  Photos updated: $updatedCount" -ForegroundColor Green
Write-Host "  Errors: $errorCount" -ForegroundColor Red
Write-Host "  Default album created: $DefaultAlbumName" -ForegroundColor White
Write-Host "  Default album ID: $DefaultAlbumId" -ForegroundColor White

if ($errorCount -eq 0) {
    Write-Host "`nMigration completed successfully!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`nMigration completed with errors. Please review the output above." -ForegroundColor Yellow
    exit 1
}