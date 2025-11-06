# Stack monitoring script (PowerShell)
param(
    [string]$StackName = "photo-backend-dev",
    [string]$Region = "us-east-1"
)

$ErrorActionPreference = "Continue"

Write-Host "🔍 Monitoring stack: $StackName in region: $Region" -ForegroundColor Green
Write-Host ""

# Function to format output
function Write-Section {
    param([string]$Title)
    Write-Host "=== $Title ===" -ForegroundColor Cyan
}

# Check if stack exists
Write-Section "Stack Validation"
try {
    $stackStatus = aws cloudformation describe-stacks `
        --stack-name $StackName `
        --region $Region `
        --query 'Stacks[0].StackStatus' `
        --output text 2>$null
    
    if ($stackStatus) {
        Write-Host "✓ Stack exists with status: $stackStatus" -ForegroundColor Green
    } else {
        Write-Host "✗ Stack not found: $StackName" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ Error checking stack status: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Check stack status
Write-Section "Stack Status"
try {
    aws cloudformation describe-stacks `
        --stack-name $StackName `
        --region $Region `
        --query 'Stacks[0].{Status:StackStatus,Created:CreationTime,Updated:LastUpdatedTime}' `
        --output table
} catch {
    Write-Host "Error getting stack status: $($_.Exception.Message)" -ForegroundColor Red
}

# Check recent events
Write-Section "Recent Events (Last 10)"
try {
    aws cloudformation describe-stack-events `
        --stack-name $StackName `
        --region $Region `
        --max-items 10 `
        --query 'StackEvents[].[Timestamp,LogicalResourceId,ResourceStatus,ResourceStatusReason]' `
        --output table
} catch {
    Write-Host "Error getting stack events: $($_.Exception.Message)" -ForegroundColor Red
}

# Get stack resources
Write-Section "Stack Resources"
try {
    aws cloudformation describe-stack-resources `
        --stack-name $StackName `
        --region $Region `
        --query 'StackResources[].[LogicalResourceId,ResourceType,ResourceStatus,PhysicalResourceId]' `
        --output table
} catch {
    Write-Host "Error getting stack resources: $($_.Exception.Message)" -ForegroundColor Red
}

# Check Lambda function metrics
Write-Section "Lambda Function Metrics (Last 24 hours)"
try {
    $functionName = aws cloudformation describe-stack-resources `
        --stack-name $StackName `
        --region $Region `
        --query 'StackResources[?ResourceType==`AWS::Lambda::Function`].PhysicalResourceId' `
        --output text 2>$null

    if ($functionName -and $functionName -ne "None") {
        Write-Host "Function Name: $functionName" -ForegroundColor Yellow
        
        # Get invocation metrics
        $startTime = (Get-Date).AddDays(-1).ToString("yyyy-MM-ddTHH:mm:ss")
        $endTime = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
        
        Write-Host "Invocations:" -ForegroundColor Yellow
        aws cloudwatch get-metric-statistics `
            --namespace AWS/Lambda `
            --metric-name Invocations `
            --dimensions Name=FunctionName,Value=$functionName `
            --start-time $startTime `
            --end-time $endTime `
            --period 3600 `
            --statistics Sum `
            --region $Region `
            --query 'Datapoints[].{Time:Timestamp,Count:Sum}' `
            --output table
        
        Write-Host "Errors:" -ForegroundColor Yellow
        aws cloudwatch get-metric-statistics `
            --namespace AWS/Lambda `
            --metric-name Errors `
            --dimensions Name=FunctionName,Value=$functionName `
            --start-time $startTime `
            --end-time $endTime `
            --period 3600 `
            --statistics Sum `
            --region $Region `
            --query 'Datapoints[].{Time:Timestamp,Errors:Sum}' `
            --output table
        
        Write-Host "Duration (Average):" -ForegroundColor Yellow
        aws cloudwatch get-metric-statistics `
            --namespace AWS/Lambda `
            --metric-name Duration `
            --dimensions Name=FunctionName,Value=$functionName `
            --start-time $startTime `
            --end-time $endTime `
            --period 3600 `
            --statistics Average `
            --region $Region `
            --query 'Datapoints[].{Time:Timestamp,AvgDuration:Average}' `
            --output table
    } else {
        Write-Host "No Lambda function found in stack" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error getting Lambda metrics: $($_.Exception.Message)" -ForegroundColor Red
}

# Check API Gateway metrics
Write-Section "API Gateway Metrics (Last 24 hours)"
try {
    $apiId = aws cloudformation describe-stack-resources `
        --stack-name $StackName `
        --region $Region `
        --query 'StackResources[?ResourceType==`AWS::ApiGateway::RestApi`].PhysicalResourceId' `
        --output text 2>$null

    if ($apiId -and $apiId -ne "None") {
        Write-Host "API ID: $apiId" -ForegroundColor Yellow
        
        $startTime = (Get-Date).AddDays(-1).ToString("yyyy-MM-ddTHH:mm:ss")
        $endTime = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
        
        Write-Host "API Requests:" -ForegroundColor Yellow
        aws cloudwatch get-metric-statistics `
            --namespace AWS/ApiGateway `
            --metric-name Count `
            --dimensions Name=ApiName,Value=$apiId `
            --start-time $startTime `
            --end-time $endTime `
            --period 3600 `
            --statistics Sum `
            --region $Region `
            --query 'Datapoints[].{Time:Timestamp,Requests:Sum}' `
            --output table
    } else {
        Write-Host "No API Gateway found in stack" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error getting API Gateway metrics: $($_.Exception.Message)" -ForegroundColor Red
}

# Check DynamoDB metrics
Write-Section "DynamoDB Metrics (Last 24 hours)"
try {
    $tableName = aws cloudformation describe-stack-resources `
        --stack-name $StackName `
        --region $Region `
        --query 'StackResources[?ResourceType==`AWS::DynamoDB::Table`].PhysicalResourceId' `
        --output text 2>$null

    if ($tableName -and $tableName -ne "None") {
        Write-Host "Table Name: $tableName" -ForegroundColor Yellow
        
        $startTime = (Get-Date).AddDays(-1).ToString("yyyy-MM-ddTHH:mm:ss")
        $endTime = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
        
        Write-Host "Read Operations:" -ForegroundColor Yellow
        aws cloudwatch get-metric-statistics `
            --namespace AWS/DynamoDB `
            --metric-name ConsumedReadCapacityUnits `
            --dimensions Name=TableName,Value=$tableName `
            --start-time $startTime `
            --end-time $endTime `
            --period 3600 `
            --statistics Sum `
            --region $Region `
            --query 'Datapoints[].{Time:Timestamp,ReadUnits:Sum}' `
            --output table
        
        Write-Host "Write Operations:" -ForegroundColor Yellow
        aws cloudwatch get-metric-statistics `
            --namespace AWS/DynamoDB `
            --metric-name ConsumedWriteCapacityUnits `
            --dimensions Name=TableName,Value=$tableName `
            --start-time $startTime `
            --end-time $endTime `
            --period 3600 `
            --statistics Sum `
            --region $Region `
            --query 'Datapoints[].{Time:Timestamp,WriteUnits:Sum}' `
            --output table
    } else {
        Write-Host "No DynamoDB table found in stack" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error getting DynamoDB metrics: $($_.Exception.Message)" -ForegroundColor Red
}

# Check recent CloudWatch logs
Write-Section "Recent Lambda Logs (Last 50 lines)"
try {
    if ($functionName -and $functionName -ne "None") {
        $logGroupName = "/aws/lambda/$functionName"
        Write-Host "Log Group: $logGroupName" -ForegroundColor Yellow
        
        aws logs filter-log-events `
            --log-group-name $logGroupName `
            --start-time $([DateTimeOffset]::Now.AddHours(-1).ToUnixTimeMilliseconds()) `
            --region $Region `
            --query 'events[].[timestamp,message]' `
            --output table `
            --max-items 50
    }
} catch {
    Write-Host "Error getting CloudWatch logs: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎯 Monitoring complete!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Useful commands:" -ForegroundColor Yellow
Write-Host "  View logs: aws logs tail /aws/lambda/$functionName --follow --region $Region" -ForegroundColor Gray
Write-Host "  Stack events: aws cloudformation describe-stack-events --stack-name $StackName --region $Region" -ForegroundColor Gray
Write-Host "  Stack outputs: aws cloudformation describe-stacks --stack-name $StackName --region $Region --query 'Stacks[0].Outputs'" -ForegroundColor Gray