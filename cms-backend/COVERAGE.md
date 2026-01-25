# Test Coverage Report

## Summary

- **Total Coverage**: 19.2% of statements
- **Store Package**: 39.7% coverage
- **Handler Package**: 11.7% coverage

## Test Files Created

### Store Tests
- ✅ `internal/store/users_test.go` - Tests for UserStore (UpsertByGoogle, GetByID)
- ✅ `internal/store/sessions_test.go` - Tests for SessionStore (Create, GetByToken, DeleteByToken, DeleteExpired)
- ✅ `internal/store/oauth_states_test.go` - Tests for OAuthStateStore (Insert, Consume)
- ✅ `internal/store/posts_test.go` - Already existed
- ✅ `internal/store/albums_test.go` - Already existed
- ✅ `internal/store/images_test.go` - Already existed
- ✅ `internal/store/links_test.go` - Already existed

### Handler Tests
- ✅ `internal/handler/utils_test.go` - Tests for utility functions (writeJSON, writeError, readJSON, parseID, randomToken)
- ✅ `internal/handler/middleware_test.go` - Tests for middleware (requireAuth, withOptionalAuth, userFromContext)

## Coverage by Package

### Store Package (39.7%)

**Well Covered:**
- `Create` methods: 100% (albums, images, posts, sessions, oauth_states)
- `LinkImageToAlbum`: 100%
- `DeleteByToken`: 100%
- `DeleteExpired`: 100%
- `GetByToken`: 85.7%
- `GetByID` (users): 85.7%
- `UpsertByGoogle`: 80.0%
- `ListImagesForAlbum`: 81.8%

**Needs Coverage:**
- `Update` methods: 0% (albums, images, posts)
- `Delete` methods: 0% (albums, posts)
- `List` methods: 0% (albums, images, posts)
- `GetByID` methods: 0% (albums, images, posts)
- `GetBySlug` methods: 0% (albums, posts)
- `LinkPostToAlbum`: 0%
- `ListAlbumsForPost`: 0%

### Handler Package (11.7%)

**Well Covered:**
- `writeJSON`: 100%
- `writeError`: 100%
- `readJSON`: 100%
- `parseID`: 100%
- `userFromContext`: 100%
- `readSessionToken`: 100%
- `withOptionalAuth`: 73.3%
- `requireAuth`: 66.7%
- `randomToken`: 75.0%

**Needs Coverage:**
- All HTTP handlers: 0% (albums, posts, images, auth handlers)
- `Routes`: 0%
- `corsMiddleware`: 0%
- `isAllowedOrigin`: 0%
- `handleHealth`: 0%
- `setSessionCookie`: 0%

## Running Tests

```bash
# Run all tests
go test ./internal/store ./internal/handler

# Run with coverage
go test -coverprofile=coverage.out ./internal/store ./internal/handler

# View coverage report
go tool cover -func=coverage.out

# Generate HTML report
go tool cover -html=coverage.out -o coverage.html
```

## Next Steps

To improve coverage, consider adding:

1. **Store Tests:**
   - Update, Delete, List, GetByID, GetBySlug methods for albums, posts, images
   - LinkPostToAlbum and ListAlbumsForPost tests

2. **Handler Tests:**
   - Integration tests for HTTP handlers using httptest
   - Tests for Routes, corsMiddleware, and API setup
   - Tests for all CRUD endpoints (albums, posts, images)
   - Tests for auth handlers (login, callback, logout, status)

3. **Integration Tests:**
   - End-to-end tests with a test database
   - Tests for complete request/response cycles
