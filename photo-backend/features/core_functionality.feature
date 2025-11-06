Feature: Core System Functionality
  As a system administrator
  I want to verify that the photo management system works correctly
  So that users can safely manage their photos

  Background:
    Given the photo management system is running

  Scenario: Authentication endpoints are accessible
    When I request to start the login process
    Then I should receive a Google OAuth URL
    And the OAuth URL should contain the correct client ID
    And I should receive a state parameter for CSRF protection

  Scenario: Authentication status works without session
    When I check my authentication status
    Then I should see that I am not authenticated
    And no user information should be returned

  Scenario: Logout works without active session
    When I attempt to logout
    Then the logout should succeed
    And I should receive a success message
    And my session cookie should be cleared

  Scenario: Protected album endpoints require authentication
    When I attempt to create an album named "Test Album"
    Then the request should be rejected
    And I should receive an authentication error

  Scenario: Protected photo endpoints require authentication
    When I attempt to upload a photo
    Then the request should be rejected
    And I should receive an authentication error

  Scenario: Album listing requires authentication
    When I attempt to list albums
    Then the request should be rejected
    And I should receive an authentication error

  Scenario: Photo listing requires authentication
    When I attempt to list photos
    Then the request should be rejected
    And I should receive an authentication error

  Scenario: Photo deletion requires authentication
    When I attempt to delete a photo
    Then the request should be rejected
    And I should receive an authentication error

  Scenario: Album deletion requires authentication
    When I attempt to delete an album
    Then the request should be rejected
    And I should receive an authentication error