Feature: Photo Management
  As an authenticated user
  I want to upload, view, and manage my photos
  So that I can store and organize my memories

  Background:
    Given the photo management system is running
    And I am authenticated as "lanctotsm@gmail.com"
    And I have an album named "Test Album"

  Scenario: Upload a photo to an album
    Given I have a valid image file
    When I upload the photo to "Test Album"
    Then the photo should be uploaded successfully
    And the photo should be stored in S3
    And the photo metadata should be saved
    And the album photo count should increase

  Scenario: List photos in an album
    Given "Test Album" contains photos:
      | Photo Name | Content Type |
      | sunset.jpg | image/jpeg   |
      | beach.png  | image/png    |
    When I request photos from "Test Album"
    Then I should see all photos in the album
    And each photo should have metadata
    And photos should include download URLs

  Scenario: Get a specific photo
    Given "Test Album" contains a photo named "sunset.jpg"
    When I request the photo "sunset.jpg"
    Then I should receive the photo details
    And the photo should include metadata
    And the photo should include a download URL

  Scenario: Delete a photo
    Given "Test Album" contains a photo named "sunset.jpg"
    When I delete the photo "sunset.jpg"
    Then the photo should be removed from storage
    And the photo metadata should be deleted
    And the album photo count should decrease

  Scenario: List all my photos across albums
    Given I have photos in multiple albums:
      | Album Name | Photo Count |
      | Vacation   | 3           |
      | Work       | 2           |
    When I request to list all my photos
    Then I should see photos from all my albums
    And each photo should show its album association

  Scenario: Unauthorized user cannot upload photos
    Given I am not authenticated
    When I attempt to upload a photo
    Then the request should be rejected
    And I should receive an authentication error

  Scenario: Unauthorized user cannot view photos
    Given I am not authenticated
    When I attempt to list photos
    Then the request should be rejected
    And I should receive an authentication error

  Scenario: Unauthorized user cannot delete photos
    Given I am not authenticated
    When I attempt to delete a photo
    Then the request should be rejected
    And I should receive an authentication error

  Scenario: Upload photo with invalid data fails
    When I attempt to upload a photo with invalid image data
    Then the upload should fail
    And I should receive a validation error

  Scenario: Upload photo without album ID fails
    Given I have a valid image file
    When I attempt to upload the photo without specifying an album
    Then the upload should fail
    And I should receive a validation error about missing album ID