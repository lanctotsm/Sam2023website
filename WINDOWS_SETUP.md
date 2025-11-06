# Windows Setup Guide for Photo Management Backend

This guide provides Windows-specific instructions for setting up and deploying the photo management backend using PowerShell.

## Prerequisites for Windows

### 1. Install Required Software

#### Option A: Using Chocolatey (Recommended)
```powershell
# Install Chocolatey (if not already installed)
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install required tools
choco install awscli
choco install golang
choco install git
choco install docker-desktop

# Install SAM CLI via pip
pip install aws-sam-cli
```

#### Option B: Manual Installation
1. **AWS CLI**: Download from [AWS CLI for Windows](https://aws.amazon.com/cli/)
2. **Go**: Download from [Go Downloads](https://golang.org/dl/)
3. **Git**: Download from [Git for Windows](https://git-scm.com/download/win)
4. **Docker Desktop**: Download from [Docker Desktop](https://www.docker.com/products/docker-desktop)
5. **Python/pip**: Download from [Python.org](https://www.python.org/downloads/) (for SAM CLI)

### 2. Configure PowerShell Execution Policy

```powershell
# Allow local scripts to run
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 3. Verify Installation

```powershell
# Check all tools are installed
aws --version
go version
git --version
sam --version
docker --version
```

## Quick Start (Windows)

### 1. Clone and Setup

```powershell
# Clone the repository
git clone <your-repo-url>
Set-Location photo-backend

# Run the Windows setup script
.\scripts\setup-aws-config.ps1
```

### 2. Configure AWS Credentials

```powershell
# Configure AWS CLI
aws configure
# Enter your AWS Access Key ID, Secret Access Key, Region, and output format
```

### 3. Deploy the Backend

```powershell
# Deploy to development environment
.\deploy-with-secrets.ps1 -StackName "photo-backend-dev" -Environment "dev" -Region "us-east-1"

# Deploy to production environment
.\deploy-with-secrets.ps1 -StackName "photo-backend-prod" -Environment "prod" -Region "us-east-1"
```

## Using Make Commands on Windows

The Makefile includes Windows-specific targets:

```powershell
# Setup AWS configuration
make setup-windows

# Build the application
make build

# Run tests
make test

# Deploy with secrets
make deploy STACK_NAME=photo-backend-dev ENVIRONMENT=dev

# Monitor the deployment
make monitor STACK_NAME=photo-backend-dev ENVIRONMENT=dev

# View help
make help
```

## PowerShell Scripts Overview

### 1. `setup-aws-config.ps1`
- Scans your AWS environment
- Generates KMS keys for encryption
- Creates `config/secrets.json` with secure random keys
- Updates `.gitignore` to exclude secrets
- Creates deployment and monitoring scripts

### 2. `deploy-with-secrets.ps1`
- Validates prerequisites (AWS CLI, SAM CLI, Go)
- Builds the Go binary for Lambda
- Validates the SAM template
- Deploys the CloudFormation stack
- Updates Next.js environment variables
- Provides useful post-deployment information

### 3. `monitor-stack.ps1`
- Monitors CloudFormation stack status
- Shows recent stack events
- Displays Lambda, API Gateway, and DynamoDB metrics
- Shows recent CloudWatch logs

## Troubleshooting Windows Issues

### PowerShell Execution Policy
If you get execution policy errors:
```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
```

### Long Path Support
Enable long path support for Git:
```powershell
git config --system core.longpaths true
```

### Docker Issues
If Docker commands fail:
1. Ensure Docker Desktop is running
2. Check if Hyper-V is enabled (Windows Pro/Enterprise)
3. For Windows Home, ensure WSL2 is installed

### AWS CLI Issues
If AWS CLI commands fail:
```powershell
# Check AWS configuration
aws configure list

# Test AWS connectivity
aws sts get-caller-identity
```

### Go Build Issues
If Go build fails:
```powershell
# Check Go installation
go version

# Check Go environment
go env

# Ensure Go modules are enabled
$env:GO111MODULE = "on"
```

## Environment Variables

### Setting Environment Variables in PowerShell
```powershell
# Temporary (current session only)
$env:AWS_REGION = "us-east-1"
$env:STACK_NAME = "photo-backend-dev"

# Permanent (user profile)
[Environment]::SetEnvironmentVariable("AWS_REGION", "us-east-1", "User")
```

### Common Environment Variables
- `AWS_REGION`: AWS region for deployment
- `AWS_PROFILE`: AWS CLI profile to use
- `STACK_NAME`: CloudFormation stack name
- `ENVIRONMENT`: Environment (dev/staging/prod)

## Windows-Specific File Paths

The scripts handle Windows file paths automatically:
- Uses backslashes (`\`) for local paths
- Uses forward slashes (`/`) for S3 keys and URLs
- Handles spaces in file names properly

## Performance Tips for Windows

### 1. Use Windows Terminal
Install Windows Terminal for better PowerShell experience:
```powershell
# Install via Microsoft Store or Chocolatey
choco install microsoft-windows-terminal
```

### 2. Enable Developer Mode
Enable Developer Mode in Windows Settings for better development experience.

### 3. Use WSL2 for Docker
If using Docker, WSL2 backend provides better performance than Hyper-V.

## Security Considerations

### 1. Secrets Management
- `config/secrets.json` is automatically added to `.gitignore`
- Use Windows Credential Manager for storing AWS credentials
- Consider using AWS SSO for better security

### 2. PowerShell Security
- Keep execution policy restrictive (`RemoteSigned`)
- Regularly update PowerShell and modules
- Use code signing for production scripts

## Next Steps

1. **Setup CI/CD**: Configure GitHub Actions or Azure DevOps
2. **Monitoring**: Set up CloudWatch dashboards
3. **Security**: Implement proper IAM roles and policies
4. **Scaling**: Configure auto-scaling and load balancing
5. **Backup**: Set up automated backups for DynamoDB

## Getting Help

### Useful Commands
```powershell
# Get help for any PowerShell script
Get-Help .\deploy-with-secrets.ps1 -Full

# Check AWS service status
aws sts get-caller-identity
aws cloudformation describe-stacks --stack-name photo-backend-dev

# View CloudFormation events
aws cloudformation describe-stack-events --stack-name photo-backend-dev --max-items 10
```

### Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| Script won't run | Check execution policy: `Set-ExecutionPolicy RemoteSigned` |
| AWS CLI not found | Add AWS CLI to PATH or reinstall |
| Go build fails | Check GOOS/GOARCH environment variables |
| SAM deploy fails | Check AWS permissions and CloudFormation limits |
| Docker issues | Restart Docker Desktop, check WSL2 |

For additional help, check the main [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) or open an issue in the repository.