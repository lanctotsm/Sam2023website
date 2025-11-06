Feature: Album Management
  As an authenticated user
  I want to manage my photo albums
  So that I can organize my photos effectively

  Background:
    Given the photo management system is running
    And I am authenticated as "lanctotsm@gmail.com"

  Scenario: Create a new album requires authentication
    When I create an album named "Vacation 2023"
    Then the request should be rejected
    And I should receive an authentication error

  Scenario: List my albums
    Given I have created albums named:
      | Album Name    |
      | Vacation 2023 |
      | Work Events   |
      | Family Photos |
    When I request to list my albums
    Then I should see all my albums
    And each album should show its photo count
    And albums should be ordered by creation date

  Scenario: Delete an album
    Given I have an album named "Test Album"
    When I delete the album "Test Album"
    Then the album should be removed successfully
    And the album should no longer appear in my album list

  Scenario: Set album thumbnail
    Given I have an album named "Vacation 2023"
    And the album contains a photo with ID "photo-123"
    When I set "photo-123" as the thumbnail for "Vacation 2023"
    Then the album thumbnail should be updated
    And the album should display the new thumbnail

  Scenario: Unauthorized user cannot create albums
    Given I am not authenticated
    When I attempt to create an album named "Unauthorized Album"
    Then the request should be rejected
    And I should receive an authentication error

  Scenario: Unauthorized user cannot list albums
    Given I am not authenticated
    When I attempt to list albums
    Then the request should be rejected
    And I should receive an authentication error

  Scenario: Unauthorized user cannot delete albums
    Given I am not authenticated
    When I attempt to delete an album
    Then the request should be rejected
    And I should receive an authentication error