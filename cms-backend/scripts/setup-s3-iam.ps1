# Setup S3 bucket permissions and IAM user for CMS uploads
# Usage: .\cms-backend\scripts\setup-s3-iam.ps1
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$BUCKET_NAME = "sam-website-bucket"
$REGION = "us-east-1"
$IAM_USER_NAME = "cms-s3-uploader"
$POLICY_NAME = "cms-s3-upload-policy"

Write-Host "Setting up S3 bucket permissions and IAM user..." -ForegroundColor Cyan
Write-Host "Bucket: $BUCKET_NAME"
Write-Host "Region: $REGION"
Write-Host "IAM User: $IAM_USER_NAME"
Write-Host ""

# Check if bucket exists
$bucketCheck = aws s3 ls "s3://$BUCKET_NAME" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Bucket $BUCKET_NAME does not exist or is not accessible" -ForegroundColor Red
    exit 1
}
Write-Host "OK: Bucket exists and is accessible" -ForegroundColor Green

# Create IAM user if it doesn't exist
$userCheck = aws iam get-user --user-name $IAM_USER_NAME 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "IAM user $IAM_USER_NAME already exists" -ForegroundColor Yellow
} else {
    Write-Host "Creating IAM user: $IAM_USER_NAME" -ForegroundColor Cyan
    aws iam create-user --user-name $IAM_USER_NAME | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK: User created" -ForegroundColor Green
    } else {
        Write-Host "Error: Failed to create IAM user" -ForegroundColor Red
        exit 1
    }
}

# Create IAM policy document
$policyDocObject = @{
    Version = "2012-10-17"
    Statement = @(
        @{
            Effect = "Allow"
            Action = @(
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            )
            Resource = @(
                "arn:aws:s3:::$BUCKET_NAME",
                "arn:aws:s3:::$BUCKET_NAME/*"
            )
        }
    )
}
$policyDoc = $policyDocObject | ConvertTo-Json -Depth 4 -Compress

# Save policy doc to temp file (no BOM)
$policyFile = [System.IO.Path]::GetTempFileName()
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($policyFile, $policyDoc, $utf8NoBom)

try {
    # Check if policy exists
    $policyArn = aws iam list-policies --query "Policies[?PolicyName=='$POLICY_NAME'].Arn" --output text 2>$null
    
    if ([string]::IsNullOrWhiteSpace($policyArn)) {
        Write-Host "Creating IAM policy: $POLICY_NAME" -ForegroundColor Cyan
        $policyArn = aws iam create-policy --policy-name $POLICY_NAME --policy-document "file://$policyFile" --query 'Policy.Arn' --output text
        Write-Host "OK: Policy created: $policyArn" -ForegroundColor Green
    } else {
        Write-Host "Policy $POLICY_NAME already exists: $policyArn" -ForegroundColor Yellow
        Write-Host "Updating policy..." -ForegroundColor Cyan
        aws iam create-policy-version --policy-arn $policyArn --policy-document "file://$policyFile" --set-as-default | Out-Null
        Write-Host "OK: Policy updated" -ForegroundColor Green
    }
} finally {
    Remove-Item $policyFile -ErrorAction SilentlyContinue
}

# Attach policy to user
Write-Host "Attaching policy to user..." -ForegroundColor Cyan
aws iam attach-user-policy --user-name $IAM_USER_NAME --policy-arn $policyArn | Out-Null
Write-Host "OK: Policy attached" -ForegroundColor Green

# Create access keys
Write-Host "Creating access keys..." -ForegroundColor Cyan
$keyOutput = aws iam create-access-key --user-name $IAM_USER_NAME --output json | ConvertFrom-Json

$accessKeyId = $keyOutput.AccessKey.AccessKeyId
$secretAccessKey = $keyOutput.AccessKey.SecretAccessKey

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "OK: Setup complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "AWS_ACCESS_KEY_ID=$accessKeyId" -ForegroundColor Yellow
Write-Host "AWS_SECRET_ACCESS_KEY=$secretAccessKey" -ForegroundColor Yellow
Write-Host ""
Write-Host "Add these to your GitHub secrets or .env file:" -ForegroundColor Cyan
Write-Host "  AWS_ACCESS_KEY_ID=$accessKeyId"
Write-Host "  AWS_SECRET_ACCESS_KEY=$secretAccessKey"
Write-Host ""
Write-Host "WARNING: Save the SECRET_ACCESS_KEY now - it won't be shown again!" -ForegroundColor Red
Write-Host "==========================================" -ForegroundColor Cyan