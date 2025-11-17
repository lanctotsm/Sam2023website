# CloudFront Configuration for Image Delivery

## Overview

The photo backend now uses **Amazon CloudFront** as a CDN (Content Delivery Network) to serve images from the S3 photo bucket. This provides significant performance, security, and cost benefits over direct S3 access.

## What Changed

### Infrastructure (SAM Template)

1. **CloudFront Distribution** - Added a CloudFront distribution that sits in front of the S3 bucket
2. **Origin Access Control (OAC)** - Configured secure access from CloudFront to S3
3. **S3 Bucket Policy** - Updated to allow ONLY CloudFront access (no more public access)
4. **Public Access Blocking** - Enabled all S3 public access blocks for better security
5. **Environment Variable** - Added `CLOUDFRONT_DOMAIN` to Lambda environment

### Backend Code

1. **Config Struct** - Added `CloudFrontDomain` field
2. **S3Storage** - Enhanced to support CloudFront URLs
3. **Main.go** - Conditionally uses CloudFront when configured
4. **URL Generation** - All image URLs now use CloudFront domain

## Benefits

### 🚀 Performance
- **Global Edge Caching** - Images cached at 300+ CloudFront edge locations worldwide
- **Faster Load Times** - Users download from nearest edge location
- **HTTP/2 & HTTP/3** - Modern protocols for improved performance
- **Compression** - Automatic gzip/brotli compression enabled

### 🔒 Security
- **HTTPS Everywhere** - All images served over HTTPS (S3 website only supports HTTP)
- **Private S3 Bucket** - No direct public access to S3
- **Origin Access Control** - CloudFront-only access via AWS SigV4
- **DDoS Protection** - AWS Shield Standard included with CloudFront
- **Secure Transport** - Enforced HTTPS at edge and origin

### 💰 Cost Savings
- **Reduced S3 Requests** - Cached images don't hit S3
- **Lower Data Transfer Costs** - CloudFront pricing better than S3 for high traffic
- **Free SSL/TLS** - Included with CloudFront
- **AWS Free Tier** - 1TB data transfer out per month free

### 🌐 Features
- **CORS Support** - Configured CORS policies for browser access
- **Custom Domains** - Can add custom domain later (requires ACM certificate)
- **Cache Control** - Optimal caching with CachingOptimized policy
- **Access Logs** - CloudFront logs sent to S3 access log bucket

## How It Works

### Before (Direct S3)
```
User Browser → S3 Bucket (us-east-1) → Image Download
```

### After (CloudFront CDN)
```
User Browser → CloudFront Edge Location (nearest) → [Cache Hit] → Image Download
                                                   ↓ [Cache Miss]
                                                   S3 Bucket (us-east-1)
```

### URL Format

**Before:**
```
https://photo-backend-photos-prod-123456789.s3.amazonaws.com/photos/abc123.jpg
```

**After:**
```
https://d1234567890abc.cloudfront.net/photos/abc123.jpg
```

## Deployment

### Automatic Configuration

When you deploy the SAM template, CloudFront is **automatically created and configured**:

1. **CloudFormation** creates the distribution (takes 10-15 minutes)
2. **Lambda environment variable** `CLOUDFRONT_DOMAIN` is set automatically
3. **Backend code** detects CloudFront and starts using it
4. **All image URLs** returned by API use CloudFront domain

### Stack Outputs

The deployment provides these outputs:

```yaml
CloudFrontDomain: d1234567890abc.cloudfront.net
CloudFrontDistributionId: E1234567890ABC
```

### Verification

Check if CloudFront is working:

```bash
# Get the CloudFront domain from stack outputs
aws cloudformation describe-stacks \
  --stack-name photo-backend-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDomain`].OutputValue' \
  --output text

# Test image access
curl -I https://{cloudfront-domain}/photos/test.jpg
```

You should see headers like:
```
X-Cache: Hit from cloudfront
X-Amz-Cf-Pop: IAD89-C1  # Edge location
```

## Configuration Details

### Cache Behavior

- **Cache Policy**: CachingOptimized (AWS Managed)
  - Caches based on query strings, headers, and cookies
  - Default TTL: 86400 seconds (24 hours)
  - Min TTL: 1 second
  - Max TTL: 31536000 seconds (1 year)

- **Origin Request Policy**: CORS-S3Origin (AWS Managed)
  - Forwards necessary headers for S3 CORS
  - Includes Origin, Access-Control-Request-Method, Access-Control-Request-Headers

- **Response Headers Policy**: CORS-With-Preflight (AWS Managed)
  - Adds CORS headers to responses
  - Supports preflight requests

### Price Class

- **PriceClass_100** - North America and Europe only
- Lowest cost tier, suitable for most use cases
- Can upgrade to PriceClass_All for global coverage

### SSL/TLS

- **Default CloudFront Certificate** - Provided at no cost
- **SNI Only** - Works with modern browsers (IE6+ not supported)
- **TLS 1.2+** - Modern security protocols

## Logging

CloudFront access logs are automatically sent to:
```
s3://{stack-name}-logs-{environment}-{account-id}/cloudfront-logs/
```

Log format includes:
- Timestamp, edge location
- Client IP and request details
- Cache status (Hit, Miss, RefreshHit)
- Response size and time

## Custom Domain (Future)

To use a custom domain (e.g., `photos.yourdomain.com`):

1. **Request ACM Certificate** in `us-east-1` (required for CloudFront)
2. **Update SAM template** with certificate ARN and domain aliases
3. **Create Route 53 records** pointing to CloudFront domain
4. **Update CORS settings** to allow your domain

## Monitoring

### CloudWatch Metrics

CloudFront provides these metrics:
- `Requests` - Total request count
- `BytesDownloaded` - Data transfer volume
- `4xxErrorRate` - Client error rate
- `5xxErrorRate` - Server error rate

### Alarms (Optional)

Consider adding CloudWatch alarms for:
- High 4xx error rate (bad requests)
- High 5xx error rate (origin issues)
- Unusual traffic spikes

## Troubleshooting

### Images Not Loading

1. **Check CloudFront domain is set**:
   ```bash
   aws lambda get-function-configuration \
     --function-name {stack-name}-processor \
     --query 'Environment.Variables.CLOUDFRONT_DOMAIN'
   ```

2. **Verify distribution is deployed**:
   ```bash
   aws cloudfront get-distribution --id {distribution-id} \
     --query 'Distribution.Status'
   # Should show: Deployed
   ```

3. **Check S3 bucket policy allows CloudFront**:
   ```bash
   aws s3api get-bucket-policy --bucket {bucket-name}
   ```

### Cache Issues

**To invalidate cached images:**
```bash
aws cloudfront create-invalidation \
  --distribution-id {distribution-id} \
  --paths "/photos/*"
```

**Note:** Invalidations have costs after the first 1000 paths per month.

### Origin Access Issues

If you see 403 errors:
1. Check OAC is attached to CloudFront distribution
2. Verify S3 bucket policy includes CloudFront service principal
3. Ensure distribution ARN matches in bucket policy condition

## Cost Estimation

For a photo gallery with moderate traffic:

### Example Usage
- 10,000 photos stored
- 100,000 monthly views
- Average photo size: 500KB

### Monthly Costs
- **CloudFront Data Transfer**: ~50GB = $4.25
- **CloudFront Requests**: 100K GET = $0.01
- **S3 Requests**: 10K GET (cache misses) = $0.004
- **S3 Data Transfer to CloudFront**: 5GB = $0.00 (free)
- **Total**: ~$4.26/month

### Without CloudFront
- **S3 Data Transfer**: 50GB = $4.50
- **S3 Requests**: 100K GET = $0.04
- **Total**: $4.54/month

**Savings**: $0.28/month + Better performance + HTTPS + Global CDN

For higher traffic, savings increase significantly!

## Backward Compatibility

The system is **fully backward compatible**:

- If `CLOUDFRONT_DOMAIN` is empty, uses direct S3 URLs
- No breaking changes to API responses
- Photo metadata structure unchanged
- Existing photos continue to work

## Next Steps

1. ✅ **Deploy the updated stack** - CloudFront will be created automatically
2. ⏳ **Wait 10-15 minutes** - For CloudFront distribution to deploy
3. ✅ **Verify CloudFront is working** - Check image URLs in API responses
4. 📊 **Monitor CloudWatch metrics** - Track performance and costs
5. 🎯 **Consider custom domain** - For branded image URLs (optional)

## Resources

- [CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [Origin Access Control](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html)
- [CloudFront Pricing](https://aws.amazon.com/cloudfront/pricing/)
- [Cache Behaviors](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/distribution-web-values-specify.html#DownloadDistValuesCacheBehavior)
