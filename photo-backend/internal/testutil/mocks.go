// Package testutil provides common test utilities and mocks for the photo-backend application.
// This package centralizes mock implementations to ensure consistency across all test files.
package testutil

import (
	"photo-backend/internal/models/auth"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/request"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbiface"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/aws/aws-sdk-go/service/s3/s3iface"
	"github.com/stretchr/testify/mock"
)

// MockDynamoDBAPI provides a mock implementation of DynamoDB API
// Uses embedding to automatically implement all interface methods
type MockDynamoDBAPI struct {
	dynamodbiface.DynamoDBAPI
	mock.Mock
}

// Override only the methods we actually use in tests
func (m *MockDynamoDBAPI) PutItem(input *dynamodb.PutItemInput) (*dynamodb.PutItemOutput, error) {
	args := m.Called(input)
	if args.Get(0) == nil {
		return &dynamodb.PutItemOutput{}, args.Error(1)
	}
	return args.Get(0).(*dynamodb.PutItemOutput), args.Error(1)
}

func (m *MockDynamoDBAPI) GetItem(input *dynamodb.GetItemInput) (*dynamodb.GetItemOutput, error) {
	args := m.Called(input)
	if args.Get(0) == nil {
		return &dynamodb.GetItemOutput{}, args.Error(1)
	}
	return args.Get(0).(*dynamodb.GetItemOutput), args.Error(1)
}

func (m *MockDynamoDBAPI) DeleteItem(input *dynamodb.DeleteItemInput) (*dynamodb.DeleteItemOutput, error) {
	args := m.Called(input)
	if args.Get(0) == nil {
		return &dynamodb.DeleteItemOutput{}, args.Error(1)
	}
	return args.Get(0).(*dynamodb.DeleteItemOutput), args.Error(1)
}

func (m *MockDynamoDBAPI) Query(input *dynamodb.QueryInput) (*dynamodb.QueryOutput, error) {
	args := m.Called(input)
	if args.Get(0) == nil {
		return &dynamodb.QueryOutput{}, args.Error(1)
	}
	return args.Get(0).(*dynamodb.QueryOutput), args.Error(1)
}

func (m *MockDynamoDBAPI) Scan(input *dynamodb.ScanInput) (*dynamodb.ScanOutput, error) {
	args := m.Called(input)
	if args.Get(0) == nil {
		return &dynamodb.ScanOutput{}, args.Error(1)
	}
	return args.Get(0).(*dynamodb.ScanOutput), args.Error(1)
}

func (m *MockDynamoDBAPI) UpdateItem(input *dynamodb.UpdateItemInput) (*dynamodb.UpdateItemOutput, error) {
	args := m.Called(input)
	if args.Get(0) == nil {
		return &dynamodb.UpdateItemOutput{}, args.Error(1)
	}
	return args.Get(0).(*dynamodb.UpdateItemOutput), args.Error(1)
}

// WithContext methods that are actually used by the storage layer
func (m *MockDynamoDBAPI) PutItemWithContext(ctx aws.Context, input *dynamodb.PutItemInput, opts ...request.Option) (*dynamodb.PutItemOutput, error) {
	args := m.Called(ctx, input, opts)
	if args.Get(0) == nil {
		return &dynamodb.PutItemOutput{}, args.Error(1)
	}
	return args.Get(0).(*dynamodb.PutItemOutput), args.Error(1)
}

func (m *MockDynamoDBAPI) GetItemWithContext(ctx aws.Context, input *dynamodb.GetItemInput, opts ...request.Option) (*dynamodb.GetItemOutput, error) {
	args := m.Called(ctx, input, opts)
	if args.Get(0) == nil {
		return &dynamodb.GetItemOutput{}, args.Error(1)
	}
	return args.Get(0).(*dynamodb.GetItemOutput), args.Error(1)
}

func (m *MockDynamoDBAPI) DeleteItemWithContext(ctx aws.Context, input *dynamodb.DeleteItemInput, opts ...request.Option) (*dynamodb.DeleteItemOutput, error) {
	args := m.Called(ctx, input, opts)
	if args.Get(0) == nil {
		return &dynamodb.DeleteItemOutput{}, args.Error(1)
	}
	return args.Get(0).(*dynamodb.DeleteItemOutput), args.Error(1)
}

func (m *MockDynamoDBAPI) QueryWithContext(ctx aws.Context, input *dynamodb.QueryInput, opts ...request.Option) (*dynamodb.QueryOutput, error) {
	args := m.Called(ctx, input, opts)
	if args.Get(0) == nil {
		return &dynamodb.QueryOutput{}, args.Error(1)
	}
	return args.Get(0).(*dynamodb.QueryOutput), args.Error(1)
}

func (m *MockDynamoDBAPI) ScanWithContext(ctx aws.Context, input *dynamodb.ScanInput, opts ...request.Option) (*dynamodb.ScanOutput, error) {
	args := m.Called(ctx, input, opts)
	if args.Get(0) == nil {
		return &dynamodb.ScanOutput{}, args.Error(1)
	}
	return args.Get(0).(*dynamodb.ScanOutput), args.Error(1)
}

func (m *MockDynamoDBAPI) UpdateItemWithContext(ctx aws.Context, input *dynamodb.UpdateItemInput, opts ...request.Option) (*dynamodb.UpdateItemOutput, error) {
	args := m.Called(ctx, input, opts)
	if args.Get(0) == nil {
		return &dynamodb.UpdateItemOutput{}, args.Error(1)
	}
	return args.Get(0).(*dynamodb.UpdateItemOutput), args.Error(1)
}

// MockS3API provides a mock implementation of S3 API
// Uses embedding to automatically implement all interface methods
type MockS3API struct {
	s3iface.S3API
	mock.Mock
}

// Override only the methods we actually use in tests
func (m *MockS3API) PutObject(input *s3.PutObjectInput) (*s3.PutObjectOutput, error) {
	args := m.Called(input)
	if args.Get(0) == nil {
		return &s3.PutObjectOutput{}, args.Error(1)
	}
	return args.Get(0).(*s3.PutObjectOutput), args.Error(1)
}

func (m *MockS3API) GetObject(input *s3.GetObjectInput) (*s3.GetObjectOutput, error) {
	args := m.Called(input)
	if args.Get(0) == nil {
		return &s3.GetObjectOutput{}, args.Error(1)
	}
	return args.Get(0).(*s3.GetObjectOutput), args.Error(1)
}

func (m *MockS3API) DeleteObject(input *s3.DeleteObjectInput) (*s3.DeleteObjectOutput, error) {
	args := m.Called(input)
	if args.Get(0) == nil {
		return &s3.DeleteObjectOutput{}, args.Error(1)
	}
	return args.Get(0).(*s3.DeleteObjectOutput), args.Error(1)
}

// MockOAuthStateStorage is a mock implementation of OAuthStateStorageInterface
type MockOAuthStateStorage struct {
	mock.Mock
}

func (m *MockOAuthStateStorage) SaveOAuthState(state *auth.OAuthState) error {
	args := m.Called(state)
	return args.Error(0)
}

func (m *MockOAuthStateStorage) GetOAuthState(state string) (*auth.OAuthState, error) {
	args := m.Called(state)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*auth.OAuthState), args.Error(1)
}

func (m *MockOAuthStateStorage) DeleteOAuthState(state string) error {
	args := m.Called(state)
	return args.Error(0)
}
