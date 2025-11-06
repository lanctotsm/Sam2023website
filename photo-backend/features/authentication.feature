Feature: User Authentication
  As a user of the photo management system
  I want to authenticate securely using Google OAuth
  So that I can access my photos and albums

  Background:
    Given the photo management system is running
    And I have valid Google OAuth credentials

  Scenario: User initiates login process
    When I request to start the login process
    Then I should receive a Google OAuth URL
    And the OAuth URL should contain the correct client ID
    And I should receive a state parameter for CSRF protection

  Scenario: User checks authentication status without session
    Given I am not authenticated
    When I check my authentication status
    Then I should see that I am not authenticated
    And no user information should be returned

  Scenario: User logs out without active session
    Given I am not authenticated
    When I attempt to logout
    Then the logout should succeed
    And I should receive a success message
    And my session cookie should be cleared

  Scenario: OAuth callback with invalid state fails
    Given I have initiated the OAuth flow
    When I provide an OAuth callback with invalid state
    Then the authentication should fail
    And I should receive an error about invalid state

  Scenario: OAuth callback without authorization code fails
    Given I have initiated the OAuth flow
    When I provide an OAuth callback without authorization code
    Then the authentication should fail
    And I should receive an error about missing authorization code