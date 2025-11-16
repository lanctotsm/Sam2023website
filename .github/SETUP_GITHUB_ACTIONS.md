# Quick Setup Guide: GitHub Actions Deployment

Follow these steps to set up automated deployments via GitHub Actions.

## Prerequisites

- GitHub repository with your code
- AWS account with appropriate permissions
- AWS CLI configured locally (for initial setup)

## Step 1: Create IAM User for CI/CD

1. Go to AWS Console → IAM → Users → Create user
2. Name: `github-actions-deploy`
3. Attach policy: Create a custom policy with these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CloudFormationPermissions",
      "Effect": "Allow",
      "Action": [
        "cloudformation:CreateStack",
        "cloudformation:UpdateStack",
        "cloudformation:DeleteStack",
        "cloudformation:DescribeStacks",
        "cloudformation:DescribeStackEvents",
        "cloudformation:DescribeStackResources",
        "cloudformation:GetTemplate",
        "cloudformation:ValidateTemplate",
        "cloudformation:ListStackResources"
      ],
      "Resource": [
        "arn:aws:cloudformation:*:*:stack/photo-backend-*/*",
        "arn:aws:cloudformation:*:*:stack/*-photo-backend-*/*"
      ]
    },
    {
      "Sid": "CloudFormationChangeSetPermissions",
      "Effect": "Allow",
      "Action": [
        "cloudformation:CreateChangeSet",
        "cloudformation:DescribeChangeSet",
        "cloudformation:ExecuteChangeSet",
        "cloudformation:DeleteChangeSet",
        "cloudformation:ListChangeSets"
      ],
      "Resource": [
        "arn:aws:cloudformation:*:*:stack/photo-backend-*/*",
        "arn:aws:cloudformation:*:*:stack/*-photo-backend-*/*"
      ]
    },
    {
      "Sid": "LambdaPermissions",
      "Effect": "Allow",
      "Action": [
        "lambda:CreateFunction",
        "lambda:UpdateFunctionCode",
        "lambda:UpdateFunctionConfiguration",
        "lambda:GetFunction",
        "lambda:GetFunctionConfiguration",
        "lambda:ListFunctions",
        "lambda:AddPermission",
        "lambda:RemovePermission",
        "lambda:TagResource",
        "lambda:UntagResource"
      ],
      "Resource": [
        "arn:aws:lambda:*:*:function:photo-backend-*",
        "arn:aws:lambda:*:*:function:*-photo-backend-*"
      ]
    },
    {
      "Sid": "APIGatewayPermissions",
      "Effect": "Allow",
      "Action": [
        "apigateway:GET",
        "apigateway:POST",
        "apigateway:PUT",
        "apigateway:PATCH",
        "apigateway:DELETE"
      ],
      "Resource": [
        "arn:aws:apigateway:*::/restapis",
        "arn:aws:apigateway:*::/restapis/*",
        "arn:aws:apigateway:*::/restapis/*/*",
        "arn:aws:apigateway:*::/restapis/*/stages/*",
        "arn:aws:apigateway:*::/restapis/*/deployments/*"
      ]
    },
    {
      "Sid": "DynamoDBPermissions",
      "Effect": "Allow",
      "Action": [
        "dynamodb:CreateTable",
        "dynamodb:UpdateTable",
        "dynamodb:DeleteTable",
        "dynamodb:DescribeTable",
        "dynamodb:DescribeTimeToLive",
        "dynamodb:ListTables",
        "dynamodb:TagResource",
        "dynamodb:UntagResource"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/photo-backend-*",
        "arn:aws:dynamodb:*:*:table/*-photo-backend-*",
        "arn:aws:dynamodb:*:*:table/photo-backend-*/index/*",
        "arn:aws:dynamodb:*:*:table/*-photo-backend-*/index/*"
      ]
    },
    {
      "Sid": "S3BucketPermissions",
      "Effect": "Allow",
      "Action": [
        "s3:CreateBucket",
        "s3:DeleteBucket",
        "s3:GetBucketLocation",
        "s3:GetBucketVersioning",
        "s3:GetBucketPolicy",
        "s3:PutBucketPolicy",
        "s3:PutBucketVersioning",
        "s3:PutBucketCors",
        "s3:PutBucketPublicAccessBlock",
        "s3:GetBucketPublicAccessBlock",
        "s3:PutLifecycleConfiguration",
        "s3:GetLifecycleConfiguration",
        "s3:PutBucketNotification",
        "s3:GetBucketNotification",
        "s3:PutBucketTagging",
        "s3:GetBucketTagging",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::photo-backend-*",
        "arn:aws:s3:::*-photo-backend-*",
        "arn:aws:s3:::*-sam-cli-deployments-*"
      ]
    },
    {
      "Sid": "S3ObjectPermissions",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:GetObjectVersion",
        "s3:PutObjectAcl"
      ],
      "Resource": [
        "arn:aws:s3:::photo-backend-*/*",
        "arn:aws:s3:::*-photo-backend-*/*",
        "arn:aws:s3:::*-sam-cli-deployments-*/*"
      ]
    },
    {
      "Sid": "IAMRolePermissions",
      "Effect": "Allow",
      "Action": [
        "iam:PassRole",
        "iam:GetRole"
      ],
      "Resource": [
        "arn:aws:iam::*:role/photo-backend-*",
        "arn:aws:iam::*:role/*-photo-backend-*"
      ],
      "Condition": {
        "StringEquals": {
          "iam:PassedToService": "lambda.amazonaws.com"
        }
      }
    },
    {
      "Sid": "CloudWatchLogsPermissions",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:DeleteLogGroup",
        "logs:DescribeLogGroups",
        "logs:PutRetentionPolicy"
      ],
      "Resource": [
        "arn:aws:logs:*:*:log-group:/aws/lambda/photo-backend-*",
        "arn:aws:logs:*:*:log-group:/aws/lambda/*-photo-backend-*",
        "arn:aws:logs:*:*:log-group:/aws/apigateway/photo-backend-*",
        "arn:aws:logs:*:*:log-group:/aws/apigateway/*-photo-backend-*",
        "arn:aws:logs:*:*:log-group:/aws/s3/photo-backend-*",
        "arn:aws:logs:*:*:log-group:/aws/s3/*-photo-backend-*"
      ]
    },
    {
      "Sid": "KMSPermissions",
      "Effect": "Allow",
      "Action": [
        "kms:CreateKey",
        "kms:CreateAlias",
        "kms:DescribeKey",
        "kms:GetKeyPolicy",
        "kms:PutKeyPolicy",
        "kms:TagResource",
        "kms:EnableKeyRotation",
        "kms:ScheduleKeyDeletion"
      ],
      "Resource": [
        "arn:aws:kms:*:*:key/*",
        "arn:aws:kms:*:*:alias/photo-backend-*",
        "arn:aws:kms:*:*:alias/*-photo-backend-*"
      ],
      "Condition": {
        "StringLike": {
          "aws:RequestTag/aws:cloudformation:stack-name": [
            "photo-backend-*",
            "*-photo-backend-*"
          ]
        }
      }
    },
    {
      "Sid": "SQSPermissions",
      "Effect": "Allow",
      "Action": [
        "sqs:CreateQueue",
        "sqs:DeleteQueue",
        "sqs:GetQueueAttributes",
        "sqs:SetQueueAttributes",
        "sqs:TagQueue",
        "sqs:UntagQueue"
      ],
      "Resource": [
        "arn:aws:sqs:*:*:photo-backend-*",
        "arn:aws:sqs:*:*:*-photo-backend-*"
      ]
    },
    {
      "Sid": "SNSPermissions",
      "Effect": "Allow",
      "Action": [
        "sns:CreateTopic",
        "sns:DeleteTopic",
        "sns:GetTopicAttributes",
        "sns:SetTopicAttributes",
        "sns:Subscribe",
        "sns:TagResource",
        "sns:UntagResource"
      ],
      "Resource": [
        "arn:aws:sns:*:*:photo-backend-*",
        "arn:aws:sns:*:*:*-photo-backend-*"
      ]
    },
    {
      "Sid": "STSPermissions",
      "Effect": "Allow",
      "Action": [
        "sts:GetCallerIdentity"
      ],
      "Resource": "*"
    }
  ]
}
```

**Note:** 
- Replace `*` in resource ARNs with your AWS account ID if you want even stricter control
- **API Gateway limitation:** API Gateway doesn't support resource-level permissions as granularly as other services, so the policy allows operations on all REST APIs. This is a known limitation of API Gateway's permission model. Consider using separate AWS accounts for different projects if you need stricter isolation.
- The policy above allows:
  - CloudFormation operations only on stacks matching `photo-backend-*` pattern
  - Lambda operations only on functions with matching names
  - S3 operations on buckets matching the pattern (including SAM deployment buckets)
  - DynamoDB operations on tables matching the pattern
  - IAM PassRole only for Lambda service and matching role names
  - CloudWatch Logs operations on log groups matching the pattern
  - KMS, SQS, SNS operations scoped to resources created by your stacks

4. Create access key → Save the Access Key ID and Secret Access Key

## Step 2: Configure GitHub Secrets

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add these secrets:

   - **Name:** `AWS_ACCESS_KEY_ID`
   - **Value:** Your IAM user access key ID

   - **Name:** `AWS_SECRET_ACCESS_KEY`
   - **Value:** Your IAM user secret access key

## Step 3: Update Production Configuration File

Ensure your production environment file has the correct values:

- `config/environments/prod.json` - Production settings

**Important:** Update `prod.json` with your actual domain:
```json
{
  "Parameters": {
    "Environment": "prod",
    "CorsOrigin": "https://yourdomain.com",
    ...
  }
}
```

## Step 4: Add OAuth Secrets (if using authentication)

If your template requires Google OAuth credentials, add them as secrets:

- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`

Then update the workflow to pass these as parameters, or use AWS Systems Manager Parameter Store.

## Step 5: Test the Workflow

1. Make a small change to `photo-backend/` directory
2. Commit and push to `main` branch
3. Go to Actions tab → Watch the workflow run
4. Check that deployment succeeds

## Step 6: Set Up Environment Protection (Production)

1. Go to Settings → Environments
2. Create environment: `production`
3. For `production`:
   - Add required reviewers (recommended)
   - Add deployment branches (only `main`)
   - Add wait timer (optional)

## How It Works

### Automatic Deployments

- **Push to `main`** → Automatically deploys to production environment

### Manual Deployments

1. Go to Actions → Deploy Photo Backend
2. Click "Run workflow"
3. Select:
   - Branch (usually `main`)
   - Stack name (optional, defaults to `photo-backend-prod`)
4. Click "Run workflow"

## Troubleshooting

### Workflow Fails: "AWS credentials not found"
- Check that secrets are set correctly
- Verify secret names match: `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`

### Deployment Fails: "Insufficient permissions"
- Check IAM user permissions
- Verify the user can create/update CloudFormation stacks

### Build Fails: "Go module not found"
- Ensure `go.mod` and `go.sum` are committed
- Check that all dependencies are available

### SAM Deploy Fails: "Template validation error"
- Run `sam validate --template template.yaml` locally
- Check that all required parameters are provided

## Next Steps

- Set up CloudWatch alarms for monitoring
- Configure deployment notifications (Slack, email)
- Add integration tests to the workflow
- Set up staging environment for pre-production testing

## Security Notes

- Never commit AWS credentials to the repository
- Rotate access keys regularly (every 90 days)
- Use separate AWS accounts for dev/staging/prod if possible
- Enable CloudTrail for audit logging
- Review IAM permissions regularly

