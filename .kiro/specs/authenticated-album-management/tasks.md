# Implementation Plan

- [x] 1. Set up authentication infrastructure and data models






  - Create Session and Album data models with proper DynamoDB tags
  - Implement Google OAuth client configuration and token validation
  - Create session management utilities for token generation and validation
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

-

- [x] 2. Implement authentication service and middleware









  - [x] 2.1 Create authentication service with Google OAuth integration




    - Implement ValidateGoogleToken method with 2FA verification
    - Create session creation and validation methods
    - Add session expiry and cleanup functionality
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.7, 1.8_
-



  - [x] 2.2 Implement session middleware for protected endpoints






    - Create RequireAuth middleware function
    - Add user extraction from session tokens
    - Implement proper error responses for authentication failures

    - _Requirements: 1.1, 1.2, 1.4, 1.5_

  - [x] 2.3 Write unit tests for authentication service





    - Test Google token validation and 2FA verification
    - Test session creation, validation, and expiry
    - Test middleware authentication flow
    - _Requirements: 1.1, 1.2, 1.3, 1.7, 1.8_

- [x] 3. Create album management service and endpoints





  - [x] 3.1 Implement album service with CRUD operations


    - Create album creation with GUID generation and name validation
    - Implement album listing (single-user system, no user isolation needed)
    - Add album thumbnail management functionality
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 4.1, 4.2, 4.3, 4.6_

  - [x] 3.2 Create album API endpoints with authentication


    - Implement POST /albums for album creation
    - Create GET /albums for listing all albums with thumbnails
    - Add PUT /albums/{albumId}/thumbnail for thumbnail management
    - Add DELETE /albums/{albumId} for album deletion
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 3.3 Write unit tests for album service


    - Test album CRUD operations (single-user system)
    - Test thumbnail management and metadata handling
    - Test album validation and error handling
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 4.1, 4.2, 4.3_

- [x] 4. Enhance photo service for album integration





  - [x] 4.1 Update photo models to include album association


    - Add AlbumID field to PhotoMetadata (single-user system, no UserEmail needed)
    - Update photo upload request to require album ID
    - Modify photo storage to include album association
    - _Requirements: 3.1, 3.2, 3.3, 3.5_

  - [x] 4.2 Implement album-aware photo upload functionality


    - Modify UploadPhoto to validate album exists and require authentication
    - Update photo processing to maintain album association
    - Implement photo-to-album linking in metadata storage
    - Ensure only authenticated users can upload photos to albums
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 4.3 Create album-specific photo listing endpoints


    - Implement GET /albums/{albumId}/photos with pagination
    - Add photo listing by album (no user validation needed for single-user)
    - Update photo metadata responses for grid display
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 4.4 Write unit tests for enhanced photo service



    - Test album-associated photo uploads and validation (single-user system)
    - Test photo listing by album with pagination
    - Test photo metadata with album information
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 5.1, 5.2, 5.3_

- [x] 5. Update API handlers with authentication and album support





  - [x] 5.1 Create authentication endpoints


    - Implement POST /auth/login for OAuth initiation
    - Create GET /auth/callback for OAuth completion
    - Add POST /auth/logout for session termination
    - Add GET /auth/status for authentication state
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

  - [x] 5.2 Update existing photo endpoints with authentication


    - Add authentication middleware to all photo endpoints (only authenticated users can upload/delete photos)
    - Update photo upload endpoint to require album ID and authentication
    - Modify photo listing to be album-aware
    - Update photo deletion with proper authentication (only authenticated user can delete)
    - _Requirements: 1.1, 1.2, 3.1, 3.2, 3.3, 5.1, 5.2_

  - [x] 5.3 Implement proper error handling and responses


    - Add 401/403/404 error responses for authentication failures
    - Implement proper error messages for album operations
    - Add validation error responses for malformed requests
    - _Requirements: 1.1, 1.2, 1.4, 1.5_

- [x] 6. Update database schema and storage layer





  - [x] 6.1 Create DynamoDB table definitions for sessions and albums


    - Define Sessions table with TTL and GSI configurations
    - Create Albums table with proper indexing (single-user system)
    - Update Photos table schema to include album field (no user field needed)
    - _Requirements: 1.6, 1.7, 1.8, 2.1, 2.3, 3.2, 3.5_

  - [x] 6.2 Implement storage layer for sessions and albums


    - Create session storage operations (create, read, update, delete)
    - Implement album storage (single-user system, no user isolation needed)
    - Update photo storage to handle album associations
    - _Requirements: 1.6, 1.7, 1.8, 2.1, 2.3, 2.4, 3.2, 3.3, 3.5_

  - [x] 6.3 Write integration tests for storage layer




    - Test session storage operations and TTL functionality
    - Test album storage (single-user system)
    - Test photo storage with album associations
    - _Requirements: 1.6, 1.7, 1.8, 2.1, 2.3, 3.2, 3.5_

- [x] 7. Update configuration and deployment




  - [x] 7.1 Add Google OAuth configuration


    - Configure Google OAuth client ID and secret
    - Set up OAuth redirect URLs and scopes
    - Add environment variables for OAuth configuration
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 7.2 Update AWS infrastructure configuration


    - Add new DynamoDB tables to CloudFormation/SAM template
    - Configure proper IAM permissions for new tables
    - Update Lambda environment variables for new services
    - _Requirements: 1.6, 1.7, 1.8, 2.1, 2.3_

  - [x] 7.3 Create deployment and migration scripts


    - Write data migration script for existing photos
    - Create database initialization scripts
    - Add deployment validation scripts
    - _Requirements: 2.1, 2.3, 3.2, 3.5_

- [x] 8. Refactor handler.go for better separation of concerns





  - [x] 8.1 Create HTTP utilities service


    - Extract ResponseBuilder, SessionExtractor, and Router classes into separate service files
    - Move HTTP response building logic to internal/service/http_utils.go
    - Move session token extraction logic to internal/service/session_utils.go
    - Move routing logic to internal/service/router.go
    - _Requirements: Code organization and maintainability_

  - [x] 8.2 Create request validation service


    - Extract common validation logic (ID extraction, request parsing) into internal/service/validation.go
    - Move extractIDFromPath, request body parsing, and validation helpers
    - Create reusable validation functions for common patterns
    - _Requirements: Code reusability and consistency_

  - [x] 8.3 Refactor handler.go to use service dependencies



    - Update Handler struct to use new service dependencies
    - Remove duplicate helper methods (successResponse, errorResponse, extractSessionToken, etc.)
    - Update all handler implementations to use the new services
    - Ensure handler.go only contains HTTP handler logic and delegates to services
    - _Requirements: Single responsibility principle and clean architecture_

- [ ] 9. Integration and end-to-end functionality




  - [x] 9.1 Wire together all services in main application


    - Initialize authentication, album, and photo services
    - Configure middleware chain with authentication for protected endpoints
    - Set up proper dependency injection for all components
    - Ensure photo upload/delete endpoints require authentication
    - _Requirements: 1.1, 1.2, 2.1, 2.3, 3.1, 3.2, 5.1, 5.2_

  - [x] 9.2 Implement complete request flow validation


    - Test full authentication flow from login to protected endpoints
    - Validate authenticated album creation and photo upload workflow
    - Ensure proper error handling across all endpoints
    - Verify unauthenticated users cannot upload or delete photos
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 5.1, 5.2_

  - [x] 9.3 Create end-to-end integration tests



    - Test complete user authentication and session management
    - Test authenticated album creation, photo upload, and listing workflows
    - Test error scenarios and edge cases including unauthorized access attempts
    - Verify authentication requirements for photo upload and deletion
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 3.3, 5.1, 5.2, 5.3_