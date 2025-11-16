STACK_NAME ?= photo-backend
ENVIRONMENT ?= dev
REGION ?= us-east-1

.PHONY: build deploy clean test lint fmt vet tidy setup-windows

# Detect OS for cross-platform commands
ifeq ($(OS),Windows_NT)
    DETECTED_OS := Windows
    RM := del /Q
    RMDIR := rmdir /S /Q
    MKDIR := mkdir
    SHELL := powershell.exe
    .SHELLFLAGS := -NoProfile -Command
else
    DETECTED_OS := $(shell uname -s)
    RM := rm -f
    RMDIR := rm -rf
    MKDIR := mkdir -p
endif

# Build the Go binary for Lambda (provided.al2 runtime requires bootstrap)
build:
ifeq ($(OS),Windows_NT)
	$env:GOOS="linux"; $env:GOARCH="amd64"; $env:CGO_ENABLED="0"; go build -ldflags="-s -w" -o bootstrap main.go
else
	GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -ldflags="-s -w" -o bootstrap main.go
endif

# Run tests
test:
	go test -v -race -coverprofile=coverage.out ./...

# Show test coverage
coverage: test
ifeq ($(OS),Windows_NT)
	go tool cover -html=coverage.out
else
	go tool cover -html=coverage.out
endif

# Lint the code (requires golangci-lint)
lint:
	golangci-lint run

# Format the code
fmt:
	go fmt ./...

# Vet the code
vet:
	go vet ./...

# Tidy dependencies
tidy:
	go mod tidy

# Run all checks
check: fmt vet test

# Setup for Windows (PowerShell scripts)
setup-windows:
ifeq ($(OS),Windows_NT)
	powershell.exe -ExecutionPolicy Bypass -File .\scripts\setup-aws-config.ps1
else
	@echo "This target is for Windows only. Use setup-linux for Linux/Mac."
endif

# Setup for Linux/Mac (Bash scripts)
setup-linux:
ifneq ($(OS),Windows_NT)
	chmod +x ./scripts/setup-aws-config.sh && ./scripts/setup-aws-config.sh
else
	@echo "This target is for Linux/Mac only. Use setup-windows for Windows."
endif

# Deploy to AWS (cross-platform)
deploy: build
ifeq ($(OS),Windows_NT)
	powershell.exe -ExecutionPolicy Bypass -File .\deploy-with-secrets.ps1 -StackName $(STACK_NAME) -Environment $(ENVIRONMENT) -Region $(REGION)
else
	./deploy-with-secrets.sh $(STACK_NAME) $(ENVIRONMENT) $(REGION)
endif

# Quick deploy (uses PowerShell on Windows, Bash elsewhere)
deploy-quick: build
ifeq ($(OS),Windows_NT)
	powershell.exe -ExecutionPolicy Bypass -File .\deploy.ps1 $(STACK_NAME) $(ENVIRONMENT) $(REGION)
else
	./deploy.sh $(STACK_NAME) $(ENVIRONMENT) $(REGION)
endif

# Monitor stack
monitor:
ifeq ($(OS),Windows_NT)
	powershell.exe -ExecutionPolicy Bypass -File .\scripts\monitor-stack.ps1 -StackName $(STACK_NAME)-$(ENVIRONMENT) -Region $(REGION)
else
	./scripts/monitor-stack.sh $(STACK_NAME)-$(ENVIRONMENT) $(REGION)
endif

# Package for deployment
package: build
	sam package \
		--template-file template.yaml \
		--s3-bucket $(DEPLOYMENT_BUCKET) \
		--output-template-file packaged-template.yaml

# Clean build artifacts
clean:
ifeq ($(OS),Windows_NT)
	if exist bootstrap $(RM) bootstrap
	if exist main $(RM) main
	if exist packaged-template.yaml $(RM) packaged-template.yaml
	if exist coverage.out $(RM) coverage.out
else
	$(RM) bootstrap main packaged-template.yaml coverage.out
endif

# Run locally with SAM
local: build
	sam local start-api --port 3001

# View Lambda logs
logs:
	sam logs -n PhotoProcessorFunction --stack-name $(STACK_NAME)-$(ENVIRONMENT) --tail

# Build Docker image
docker-build:
	docker build -t photo-backend .

# Run with Docker
docker-run:
	docker run -p 8080:8080 photo-backend

# Help target
help:
	@echo "Available targets:"
	@echo "  build          - Build Go binary for Lambda"
	@echo "  test           - Run tests with coverage"
	@echo "  coverage       - Show test coverage report"
	@echo "  fmt            - Format Go code"
	@echo "  vet            - Run go vet"
	@echo "  tidy           - Tidy Go modules"
	@echo "  check          - Run fmt, vet, and test"
	@echo "  setup-windows  - Setup AWS config (Windows PowerShell)"
	@echo "  setup-linux    - Setup AWS config (Linux/Mac Bash)"
	@echo "  deploy         - Deploy with secrets (cross-platform)"
	@echo "  deploy-quick   - Quick deploy without secrets"
	@echo "  monitor        - Monitor deployed stack"
	@echo "  local          - Run locally with SAM"
	@echo "  logs           - View Lambda logs"
	@echo "  clean          - Clean build artifacts"
	@echo "  docker-build   - Build Docker image"
	@echo "  docker-run     - Run with Docker"
	@echo ""
	@echo "Variables:"
	@echo "  STACK_NAME     - CloudFormation stack name (default: photo-backend)"
	@echo "  ENVIRONMENT    - Environment (dev/staging/prod, default: dev)"
	@echo "  REGION         - AWS region (default: us-east-1)"