# Go Code Generation Prompt - Clean & Efficient Standards

## Core Principles

When generating Go code, follow these fundamental principles:

1. **Simplicity over Complexity** - Choose the simplest solution that works
2. **Readability First** - Code is read more than it's written
3. **Explicit over Implicit** - Make intentions clear
4. **Composition over Inheritance** - Use interfaces and embedding
5. **Error Handling** - Handle errors explicitly, don't ignore them

## Code Structure & Organization

### Package Structure
```go
// ✅ Good: Clear, focused package with single responsibility
package user

// ✅ Good: Package comment explains purpose
// Package user provides user management functionality including
// authentication, profile management, and user preferences.

// ❌ Bad: Generic package name
package utils
```

### File Organization
- One primary type per file
- Group related functions together
- Keep files under 500 lines when possible
- Use meaningful file names: `user_service.go`, `auth_middleware.go`

### Import Grouping
```go
// ✅ Good: Proper import grouping
import (
    // Standard library
    "context"
    "fmt"
    "net/http"
    
    // Third-party packages
    "github.com/aws/aws-lambda-go/events"
    "github.com/google/uuid"
    
    // Local packages
    "myproject/internal/models"
    "myproject/internal/service"
)
```

## Naming Conventions

### Variables & Functions
```go
// ✅ Good: Clear, descriptive names
func ProcessUserRegistration(ctx context.Context, req *RegistrationRequest) error
var userCount int
var isAuthenticated bool

// ❌ Bad: Abbreviated or unclear names
func ProcUsrReg(ctx context.Context, req *RegReq) error
var usrCnt int
var isAuth bool
```

### Constants & Types
```go
// ✅ Good: Descriptive constants
const (
    MaxRetryAttempts = 3
    DefaultTimeout   = 30 * time.Second
    APIVersion       = "v1"
)

// ✅ Good: Clear type names
type UserService struct {
    repository UserRepository
    logger     Logger
}

type AuthenticationError struct {
    UserID  string
    Reason  string
    Attempt int
}
```

## Interface Design

### Small, Focused Interfaces
```go
// ✅ Good: Single responsibility interface
type UserRepository interface {
    GetUser(ctx context.Context, id string) (*User, error)
    SaveUser(ctx context.Context, user *User) error
    DeleteUser(ctx context.Context, id string) error
}

// ✅ Good: Composition of interfaces
type UserService interface {
    UserRepository
    UserValidator
}

// ❌ Bad: Too many responsibilities
type UserManager interface {
    GetUser(ctx context.Context, id string) (*User, error)
    SaveUser(ctx context.Context, user *User) error
    SendEmail(to, subject, body string) error
    LogActivity(action string) error
    ValidateInput(data interface{}) error
}
```

## Error Handling

### Explicit Error Handling
```go
// ✅ Good: Explicit error handling with context
func (s *UserService) CreateUser(ctx context.Context, req *CreateUserRequest) (*User, error) {
    if err := s.validateRequest(req); err != nil {
        return nil, fmt.Errorf("invalid request: %w", err)
    }
    
    user, err := s.repository.CreateUser(ctx, req)
    if err != nil {
        return nil, fmt.Errorf("failed to create user: %w", err)
    }
    
    return user, nil
}

// ✅ Good: Custom error types for specific cases
type ValidationError struct {
    Field   string
    Message string
}

func (e ValidationError) Error() string {
    return fmt.Sprintf("validation failed for %s: %s", e.Field, e.Message)
}
```

### Error Wrapping
```go
// ✅ Good: Proper error wrapping with context
if err := database.Save(user); err != nil {
    return fmt.Errorf("saving user %s to database: %w", user.ID, err)
}

// ❌ Bad: Losing error context
if err := database.Save(user); err != nil {
    return errors.New("database error")
}
```

## Function Design

### Function Signatures
```go
// ✅ Good: Context first, options last
func ProcessPayment(ctx context.Context, userID string, amount decimal.Decimal, opts ...PaymentOption) (*Payment, error)

// ✅ Good: Clear return types
func (s *UserService) GetUserProfile(ctx context.Context, userID string) (*UserProfile, error)

// ❌ Bad: Too many parameters
func CreateUser(firstName, lastName, email, phone, address, city, state, zip, country string) error
```

### Function Length
- Keep functions under 50 lines when possible
- Extract complex logic into helper functions
- Use early returns to reduce nesting

```go
// ✅ Good: Early returns, clear flow
func (s *AuthService) ValidateToken(token string) (*User, error) {
    if token == "" {
        return nil, ErrEmptyToken
    }
    
    claims, err := s.parseToken(token)
    if err != nil {
        return nil, fmt.Errorf("parsing token: %w", err)
    }
    
    if claims.IsExpired() {
        return nil, ErrTokenExpired
    }
    
    return s.getUserFromClaims(claims)
}
```

## Struct Design

### Composition over Inheritance
```go
// ✅ Good: Composition with clear dependencies
type UserService struct {
    repository UserRepository
    validator  UserValidator
    logger     Logger
    config     *Config
}

// ✅ Good: Embedding for extending behavior
type AdminUser struct {
    User
    Permissions []Permission
    LastLogin   time.Time
}
```

### Constructor Pattern
```go
// ✅ Good: Constructor with validation
func NewUserService(repo UserRepository, validator UserValidator, logger Logger) (*UserService, error) {
    if repo == nil {
        return nil, errors.New("repository is required")
    }
    if validator == nil {
        return nil, errors.New("validator is required")
    }
    
    return &UserService{
        repository: repo,
        validator:  validator,
        logger:     logger,
    }, nil
}
```

## Concurrency Patterns

### Context Usage
```go
// ✅ Good: Proper context usage
func (s *UserService) ProcessUsers(ctx context.Context, userIDs []string) error {
    for _, userID := range userIDs {
        select {
        case <-ctx.Done():
            return ctx.Err()
        default:
            if err := s.processUser(ctx, userID); err != nil {
                return fmt.Errorf("processing user %s: %w", userID, err)
            }
        }
    }
    return nil
}
```

### Goroutine Management
```go
// ✅ Good: Proper goroutine lifecycle management
func (s *Service) ProcessConcurrently(ctx context.Context, items []Item) error {
    ctx, cancel := context.WithCancel(ctx)
    defer cancel()
    
    errCh := make(chan error, len(items))
    semaphore := make(chan struct{}, 10) // Limit concurrency
    
    for _, item := range items {
        go func(item Item) {
            semaphore <- struct{}{}
            defer func() { <-semaphore }()
            
            if err := s.processItem(ctx, item); err != nil {
                errCh <- err
                cancel() // Cancel other goroutines on error
            }
        }(item)
    }
    
    // Wait for completion or error
    for i := 0; i < len(items); i++ {
        select {
        case err := <-errCh:
            return err
        case <-ctx.Done():
            return ctx.Err()
        }
    }
    
    return nil
}
```

## Testing Patterns

### Table-Driven Tests
```go
// ✅ Good: Comprehensive table-driven tests
func TestUserService_CreateUser(t *testing.T) {
    tests := []struct {
        name    string
        request *CreateUserRequest
        setup   func(*MockRepository)
        want    *User
        wantErr bool
        errType error
    }{
        {
            name: "successful creation",
            request: &CreateUserRequest{
                Email: "test@example.com",
                Name:  "Test User",
            },
            setup: func(repo *MockRepository) {
                repo.EXPECT().CreateUser(gomock.Any(), gomock.Any()).Return(&User{
                    ID:    "123",
                    Email: "test@example.com",
                    Name:  "Test User",
                }, nil)
            },
            want: &User{
                ID:    "123",
                Email: "test@example.com",
                Name:  "Test User",
            },
            wantErr: false,
        },
        {
            name: "validation error",
            request: &CreateUserRequest{
                Email: "invalid-email",
            },
            setup:   func(repo *MockRepository) {},
            want:    nil,
            wantErr: true,
            errType: ValidationError{},
        },
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            ctrl := gomock.NewController(t)
            defer ctrl.Finish()
            
            repo := NewMockRepository(ctrl)
            tt.setup(repo)
            
            service := NewUserService(repo, NewValidator(), NewLogger())
            
            got, err := service.CreateUser(context.Background(), tt.request)
            
            if tt.wantErr {
                assert.Error(t, err)
                if tt.errType != nil {
                    assert.IsType(t, tt.errType, err)
                }
                return
            }
            
            assert.NoError(t, err)
            assert.Equal(t, tt.want, got)
        })
    }
}
```

## Performance Considerations

### Memory Efficiency
```go
// ✅ Good: Reuse slices, avoid unnecessary allocations
func ProcessItems(items []Item) []Result {
    results := make([]Result, 0, len(items)) // Pre-allocate capacity
    
    for _, item := range items {
        if result := processItem(item); result != nil {
            results = append(results, *result)
        }
    }
    
    return results
}

// ✅ Good: Use string builder for concatenation
func BuildMessage(parts []string) string {
    var builder strings.Builder
    builder.Grow(estimateSize(parts)) // Pre-allocate if size is known
    
    for i, part := range parts {
        if i > 0 {
            builder.WriteString(", ")
        }
        builder.WriteString(part)
    }
    
    return builder.String()
}
```

### Database Patterns
```go
// ✅ Good: Batch operations, proper connection management
func (r *UserRepository) CreateUsers(ctx context.Context, users []*User) error {
    tx, err := r.db.BeginTx(ctx, nil)
    if err != nil {
        return fmt.Errorf("beginning transaction: %w", err)
    }
    defer tx.Rollback() // Safe to call even after commit
    
    stmt, err := tx.PrepareContext(ctx, "INSERT INTO users (id, email, name) VALUES (?, ?, ?)")
    if err != nil {
        return fmt.Errorf("preparing statement: %w", err)
    }
    defer stmt.Close()
    
    for _, user := range users {
        if _, err := stmt.ExecContext(ctx, user.ID, user.Email, user.Name); err != nil {
            return fmt.Errorf("inserting user %s: %w", user.ID, err)
        }
    }
    
    if err := tx.Commit(); err != nil {
        return fmt.Errorf("committing transaction: %w", err)
    }
    
    return nil
}
```

## Documentation Standards

### Package Documentation
```go
// Package auth provides authentication and authorization functionality
// for the application. It supports multiple authentication methods including
// JWT tokens, API keys, and OAuth2 flows.
//
// Basic usage:
//
//     auth := auth.NewService(config)
//     token, err := auth.Authenticate(ctx, credentials)
//     if err != nil {
//         // handle error
//     }
//
// The package is designed to be extensible and supports custom
// authentication providers through the Provider interface.
package auth
```

### Function Documentation
```go
// CreateUser creates a new user account with the provided information.
// It validates the input, checks for existing users with the same email,
// and stores the user in the database.
//
// The function returns the created user with a generated ID, or an error
// if validation fails or the user already exists.
//
// Example:
//     user, err := service.CreateUser(ctx, &CreateUserRequest{
//         Email: "user@example.com",
//         Name:  "John Doe",
//     })
func (s *UserService) CreateUser(ctx context.Context, req *CreateUserRequest) (*User, error) {
    // Implementation...
}
```

## Code Generation Checklist

When generating Go code, ensure:

- [ ] Package has clear purpose and documentation
- [ ] All public functions have documentation comments
- [ ] Error handling is explicit and provides context
- [ ] Interfaces are small and focused
- [ ] Functions have single responsibility
- [ ] Context is used for cancellation and timeouts
- [ ] Resources are properly cleaned up (defer statements)
- [ ] Tests are included for public functions
- [ ] No unused imports or variables
- [ ] Consistent naming conventions
- [ ] Proper error wrapping with fmt.Errorf
- [ ] Struct fields are properly tagged (json, db, etc.)
- [ ] Constants are used instead of magic numbers
- [ ] Goroutines are properly managed
- [ ] Database transactions are handled correctly

## Anti-Patterns to Avoid

```go
// ❌ Bad: Ignoring errors
result, _ := someFunction()

// ❌ Bad: Generic error messages
return errors.New("something went wrong")

// ❌ Bad: Too many parameters
func CreateUser(name, email, phone, address, city, state, zip string, age int, active bool) error

// ❌ Bad: Returning nil interface
func GetUser() UserInterface {
    return nil // This can cause runtime panics
}

// ❌ Bad: Not using context
func ProcessData(data []byte) error {
    // Long-running operation without cancellation
}

// ❌ Bad: Mutating input parameters
func ProcessUsers(users []User) {
    for i := range users {
        users[i].Processed = true // Mutating input
    }
}
```

Use this prompt as a reference when generating Go code to ensure clean, efficient, and maintainable solutions.