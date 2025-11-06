package storage

import (
	"photo-backend/internal/testutil"
)

// Use the common mocks from testutil package
type MockDynamoDBAPI = testutil.MockDynamoDBAPI
type MockOAuthStateStorage = testutil.MockOAuthStateStorage
