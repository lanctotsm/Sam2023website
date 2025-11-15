# GitHub Deployment Guide for Photo Backend

This guide covers the best practices for deploying your AWS stack (Lambda, DynamoDB, S3) with code hosted on GitHub.

## Deployment Options

### Option 1: GitHub Actions (Recommended) ⭐

**Best for:** Most GitHub-native solution, easy setup, free for public repos

**Pros:**
- Native GitHub integration
- Free for public repositories
- Easy to configure and maintain
- Supports multiple environments
- Built-in secrets management
- Manual deployment triggers

**Cons:**
- Requires GitHub Actions minutes for private repos
- Less AWS-native than CodePipeline

#### Setup Steps

1. **Configure GitHub Secrets**

   Go to your GitHub repository → Settings → Secrets and variables → Actions, and add:

   - `AWS_ACCESS_KEY_ID` - Your AWS access key
   - `AWS_SECRET_ACCESS_KEY` - Your AWS secret key

   **Security Best Practice:** Create a dedicated IAM user for CI/CD with least-privilege permissions. See `.github/SETUP_GITHUB_ACTIONS.md` for the complete least-privilege policy that restricts access to only your photo-backend resources.

2. **Create Production Configuration File**

   Ensure your production environment parameter file exists:

   ```bash
   config/environments/prod.json
   ```

3. **Workflow Behavior**

   - **Automatic Deployments:**
     - Pushes to `main` branch → Automatically deploys to **production**
   
   - **Manual Deployments:**
     - Go to Actions → Deploy Photo Backend → Run workflow
     - Select branch (usually `main`) and optional stack name

4. **Deploy**

   The workflow will:
   - Run tests
   - Build the Go binary
   - Deploy using SAM CLI
   - Output API endpoint URL

### Option 2: AWS CodePipeline

**Best for:** Fully AWS-native solution, advanced pipeline features

**Pros:**
- Fully integrated with AWS services
- Advanced pipeline features (approvals, parallel stages)
- Better for complex multi-service deployments
- Native integration with CodeBuild, CodeDeploy

**Cons:**
- More complex setup
- Requires GitHub OAuth token
- Additional AWS service costs

#### Setup Steps

1. **Deploy the Pipeline Stack**

   ```powershell
   aws cloudformation create-stack `
     --stack-name photo-backend-pipeline `
     --template-body file://pipeline-template.yaml `
     --parameters `
       ParameterKey=GitHubRepo,ParameterValue=your-username/your-repo `
       ParameterKey=GitHubBranch,ParameterValue=main `
       ParameterKey=GitHubToken,ParameterValue=your-github-token `
       ParameterKey=NotificationEmail,ParameterValue=your-email@example.com `
     --capabilities CAPABILITY_IAM
   ```

2. **Create GitHub Personal Access Token**

   - Go to GitHub → Settings → Developer settings → Personal access tokens
   - Create token with `repo` scope
   - Use this token in the pipeline stack

3. **Pipeline Flow**

   ```
   GitHub (Source) → CodeBuild (Build & Test) → CodeBuild (Deploy) → AWS Resources
   ```

### Option 3: Manual Deployment Scripts

**Best for:** Quick deployments, local development, one-off updates

**Pros:**
- Full control over deployment process
- Good for debugging
- No CI/CD overhead

**Cons:**
- Manual process
- No automated testing
- Easy to forget steps

#### Usage

```powershell
# Development
cd photo-backend
.\deploy.ps1 -StackName photo-backend-dev -Environment dev -Region us-east-1

# Production
.\deploy.ps1 -StackName photo-backend-prod -Environment prod -Region us-east-1
```

## Comparison Matrix

| Feature | GitHub Actions | CodePipeline | Manual Scripts |
|---------|---------------|--------------|----------------|
| **Setup Complexity** | Low | Medium | Low |
| **Cost** | Free (public) / Minutes (private) | AWS service costs | None |
| **Automated Testing** | ✅ Yes | ✅ Yes | ❌ No |
| **Multi-Environment** | ✅ Yes | ✅ Yes | ⚠️ Manual |
| **Approval Gates** | ⚠️ Limited | ✅ Yes | ❌ No |
| **GitHub Integration** | ✅ Native | ⚠️ Requires token | ❌ No |
| **AWS Integration** | ⚠️ Via CLI | ✅ Native | ⚠️ Via CLI |
| **Best For** | Most projects | Enterprise/complex | Quick deploys |

## Recommended Approach

### For Most Projects: GitHub Actions

1. **Start with GitHub Actions** - It's the simplest and most GitHub-native
2. **Use environment protection rules** for production deployments
3. **Add approval gates** using GitHub Environments (Settings → Environments)

### For Enterprise/Complex Projects: CodePipeline

1. Use CodePipeline if you need:
   - Complex approval workflows
   - Integration with multiple AWS services
   - Advanced pipeline features

## Security Best Practices

### 1. IAM Permissions

Create a dedicated IAM user/role for CI/CD with least privilege. The policy should:

- **Restrict resources** to only those matching your stack naming pattern (`photo-backend-*`)
- **Limit actions** to only what's needed for deployment
- **Use conditions** to further restrict access (e.g., IAM PassRole only for Lambda)
- **Exclude wildcard permissions** on resources

See `.github/SETUP_GITHUB_ACTIONS.md` for the complete least-privilege IAM policy that includes:
- CloudFormation operations scoped to your stacks
- Lambda operations scoped to your functions
- S3 operations scoped to your buckets (including SAM deployment buckets)
- DynamoDB operations scoped to your tables
- IAM PassRole with service condition
- CloudWatch Logs, KMS, SQS, SNS scoped to your resources

### 2. Secrets Management

- **Never commit secrets** to the repository
- Use GitHub Secrets for sensitive values
- Use AWS Systems Manager Parameter Store or Secrets Manager for runtime secrets
- Rotate credentials regularly

### 3. Environment Protection

- Enable branch protection rules
- Require pull request reviews
- Use GitHub Environments with approval requirements for production

### 4. Least Privilege

- Grant only necessary permissions
- Use separate AWS accounts for dev/staging/prod if possible
- Enable CloudTrail for audit logging

## Environment Configuration

### Production Environment

```json
{
  "Parameters": {
    "Environment": "prod",
    "EnableLogging": "true",
    "EnableXRay": "true",
    "CorsOrigin": "https://yourdomain.com",
    "LambdaMemorySize": "512",
    "LambdaTimeout": "30",
    "EnableEncryption": "true",
    "EnableVersioning": "true"
  }
}
```

## Monitoring Deployments

### GitHub Actions

- View deployment status in Actions tab
- Check logs for each step
- Use deployment environments for tracking

### CodePipeline

- View pipeline execution in AWS Console
- Set up CloudWatch alarms for failures
- Configure SNS notifications

### Manual Scripts

- Check CloudFormation stack status:
  ```powershell
  aws cloudformation describe-stacks --stack-name photo-backend-prod
  ```

## Troubleshooting

### Common Issues

1. **Deployment Fails: Insufficient Permissions**
   - Check IAM user/role permissions
   - Verify CloudFormation capabilities

2. **Lambda Function Not Updating**
   - Ensure binary is built for Linux (`GOOS=linux`)
   - Check SAM template CodeUri path

3. **GitHub Actions: Secrets Not Found**
   - Verify secrets are set in repository settings
   - Check secret names match workflow file

4. **CodePipeline: GitHub Connection Issues**
   - Verify GitHub token is valid
   - Check webhook configuration

## Next Steps

1. **Set up GitHub Actions** (recommended starting point)
2. **Configure environment protection rules** for production
3. **Set up monitoring and alerts** for deployments
4. **Document your deployment process** for your team
5. **Consider adding deployment notifications** (Slack, email, etc.)

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [AWS CodePipeline Documentation](https://docs.aws.amazon.com/codepipeline/)
- [Project Deployment Guide](./DEPLOYMENT_GUIDE.md)

