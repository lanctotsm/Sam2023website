#!/bin/bash
# Setup S3 bucket permissions and IAM user for CMS uploads
# Usage: ./scripts/setup-s3-iam.sh

set -e

BUCKET_NAME="sam-website-bucket"
REGION="us-east-1"
IAM_USER_NAME="cms-s3-uploader"
POLICY_NAME="cms-s3-upload-policy"

echo "Setting up S3 bucket permissions and IAM user..."
echo "Bucket: $BUCKET_NAME"
echo "Region: $REGION"
echo "IAM User: $IAM_USER_NAME"
echo ""

# Check if bucket exists
if ! aws s3 ls "s3://$BUCKET_NAME" 2>/dev/null; then
    echo "Error: Bucket $BUCKET_NAME does not exist or is not accessible"
    exit 1
fi

# Create IAM user if it doesn't exist
if aws iam get-user --user-name "$IAM_USER_NAME" 2>/dev/null; then
    echo "IAM user $IAM_USER_NAME already exists"
else
    echo "Creating IAM user: $IAM_USER_NAME"
    aws iam create-user --user-name "$IAM_USER_NAME"
    echo "OK: User created"
fi

# Create IAM policy document
POLICY_DOC=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::$BUCKET_NAME",
        "arn:aws:s3:::$BUCKET_NAME/*"
      ]
    }
  ]
}
EOF
)

# Check if policy exists, create if not
POLICY_ARN=$(aws iam list-policies --query "Policies[?PolicyName=='$POLICY_NAME'].Arn" --output text 2>/dev/null || echo "")

if [ -z "$POLICY_ARN" ]; then
    echo "Creating IAM policy: $POLICY_NAME"
    POLICY_ARN=$(aws iam create-policy \
        --policy-name "$POLICY_NAME" \
        --policy-document "$POLICY_DOC" \
        --query 'Policy.Arn' \
        --output text)
    echo "OK: Policy created: $POLICY_ARN"
else
    echo "Policy $POLICY_NAME already exists: $POLICY_ARN"
    echo "Updating policy..."
    aws iam create-policy-version \
        --policy-arn "$POLICY_ARN" \
        --policy-document "$POLICY_DOC" \
        --set-as-default
    echo "OK: Policy updated"
fi

# Attach policy to user
echo "Attaching policy to user..."
aws iam attach-user-policy \
    --user-name "$IAM_USER_NAME" \
    --policy-arn "$POLICY_ARN"
echo "OK: Policy attached"

# Create access keys
echo "Creating access keys..."
KEY_OUTPUT=$(aws iam create-access-key --user-name "$IAM_USER_NAME" --output json)

ACCESS_KEY_ID=$(echo "$KEY_OUTPUT" | jq -r '.AccessKey.AccessKeyId')
SECRET_ACCESS_KEY=$(echo "$KEY_OUTPUT" | jq -r '.AccessKey.SecretAccessKey')

echo ""
echo "=========================================="
echo "OK: Setup complete!"
echo "=========================================="
echo ""
echo "AWS_ACCESS_KEY_ID=$ACCESS_KEY_ID"
echo "AWS_SECRET_ACCESS_KEY=$SECRET_ACCESS_KEY"
echo ""
echo "Add these to your GitHub secrets or .env file:"
echo "  AWS_ACCESS_KEY_ID=$ACCESS_KEY_ID"
echo "  AWS_SECRET_ACCESS_KEY=$SECRET_ACCESS_KEY"
echo ""
echo "WARNING: Save the SECRET_ACCESS_KEY now - it won't be shown again!"
echo "=========================================="
