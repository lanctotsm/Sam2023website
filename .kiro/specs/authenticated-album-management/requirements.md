# Requirements Document

## Introduction

This document specifies the requirements for enhancing the photo backend system with Google OAuth 2FA authentication and album-based photo organization. The system will restrict photo uploads to a single authenticated user and organize photos into named albums with adaptive display capabilities.

## Glossary

- **Photo_Backend_System**: The AWS Lambda-based photo management service
- **Google_OAuth_Service**: Google's OAuth 2.0 authentication service with 2-factor authentication
- **Authorized_User**: The specific user with email lanctotsm@gmail.com
- **Album**: A named collection of photos that serves as an organizational unit
- **Album_Thumbnail**: A representative image displayed for an album, either randomly selected or user-specified
- **Grid_Display**: A responsive layout showing multiple items in rows and columns
- **Adaptive_Layout**: A display format that adjusts between list and grid based on available screen space

## Requirements

### Requirement 1

**User Story:** As the system owner, I want only the authorized user with 2FA to access the upload functionality, so that the photo system remains secure and private.

#### Acceptance Criteria

1. WHEN a user attempts to upload an image, THE Photo_Backend_System SHALL validate the user's Google OAuth token
2. IF the authenticated user email is not "lanctotsm@gmail.com", THEN THE Photo_Backend_System SHALL reject the upload request with a 403 Forbidden status
3. WHEN validating authentication, THE Photo_Backend_System SHALL verify that 2-factor authentication was used during the Google OAuth flow
4. THE Photo_Backend_System SHALL return authentication errors with appropriate HTTP status codes and error messages
5. WHEN an upload request lacks valid authentication, THE Photo_Backend_System SHALL reject the request without processing the image data

### Requirement 1.1

**User Story:** As the system owner, I want unauthenticated users to be unable to access the upload page, so that the system maintains proper access control.

#### Acceptance Criteria

1. WHEN an unauthenticated user attempts to access the upload page, THE Photo_Backend_System SHALL return a 404 Not Found response
2. WHEN an unauthenticated user views the navigation menu, THE Photo_Backend_System SHALL not display the upload page link
3. WHEN an authenticated user views the navigation menu, THE Photo_Backend_System SHALL display the upload page link
4. THE Photo_Backend_System SHALL provide a login endpoint at "/login" that initiates Google OAuth flow
5. WHEN a user successfully authenticates at "/login", THE Photo_Backend_System SHALL redirect them to the home page
6. THE Photo_Backend_System SHALL maintain session state in DynamoDB using industry-standard session management practices
7. THE Photo_Backend_System SHALL expire user sessions after 24 hours of inactivity
8. THE Photo_Backend_System SHALL use secure session tokens with sufficient entropy to prevent session hijacking

### Requirement 2

**User Story:** As a user, I want to create named albums to organize my photos, so that I can group related images together.

#### Acceptance Criteria

1. WHEN the Authorized_User creates an album, THE Photo_Backend_System SHALL generate a unique GUID identifier and store the user-specified album name
2. THE Photo_Backend_System SHALL validate that album names are non-empty and contain only valid characters
3. WHEN creating an album, THE Photo_Backend_System SHALL associate the album with the Authorized_User
4. THE Photo_Backend_System SHALL allow multiple albums to have the same name since each has a unique GUID
5. WHEN an album is created, THE Photo_Backend_System SHALL return the album metadata including GUID and user-specified name

### Requirement 3

**User Story:** As a user, I want to upload photos to specific albums, so that my images are properly organized.

#### Acceptance Criteria

1. WHEN uploading a photo, THE Photo_Backend_System SHALL require the user to specify a target album ID
2. THE Photo_Backend_System SHALL validate that the specified album exists and belongs to the Authorized_User
3. WHEN a photo is uploaded, THE Photo_Backend_System SHALL associate the photo with the specified album
4. THE Photo_Backend_System SHALL maintain the existing image processing functionality (original, medium, thumbnail variants)
5. WHEN saving photo metadata, THE Photo_Backend_System SHALL include the album association

### Requirement 4

**User Story:** As a user, I want to view my albums with representative thumbnails, so that I can easily identify and select albums.

#### Acceptance Criteria

1. WHEN listing albums, THE Photo_Backend_System SHALL return each album with its associated Album_Thumbnail
2. WHERE no specific thumbnail is set, THE Photo_Backend_System SHALL use a randomly selected photo from the album as the Album_Thumbnail
3. THE Photo_Backend_System SHALL allow the user to specify which photo serves as the Album_Thumbnail
4. WHEN an album contains no photos, THE Photo_Backend_System SHALL return the album without a thumbnail image
5. THE Photo_Backend_System SHALL include album metadata such as name, photo count, and creation date
6. THE Photo_Backend_System SHALL provide thumbnail image URLs that the frontend can display within folder icon imagery

### Requirement 5

**User Story:** As a user, I want to view photos within a selected album in a grid format, so that I can browse my organized images effectively.

#### Acceptance Criteria

1. WHEN requesting photos for a specific album, THE Photo_Backend_System SHALL return only photos associated with that album
2. THE Photo_Backend_System SHALL return photo metadata in a format suitable for Grid_Display rendering
3. WHEN listing album photos, THE Photo_Backend_System SHALL include thumbnail URLs for efficient grid loading
4. THE Photo_Backend_System SHALL support pagination for albums with large numbers of photos
5. THE Photo_Backend_System SHALL return photos ordered by upload date (newest first)

### Requirement 6

**User Story:** As a user, I want albums to display adaptively as either a list or grid based on screen space, so that the interface works well on different devices.

#### Acceptance Criteria

1. WHEN the frontend requests album data, THE Photo_Backend_System SHALL provide metadata necessary for Adaptive_Layout rendering
2. THE Photo_Backend_System SHALL include thumbnail dimensions in album responses to support layout calculations
3. WHEN returning album lists, THE Photo_Backend_System SHALL provide both compact and detailed metadata formats
4. THE Photo_Backend_System SHALL support query parameters to request different levels of album detail
5. THE Photo_Backend_System SHALL return album data optimized for both list and grid display formats