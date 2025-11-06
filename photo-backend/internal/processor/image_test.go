package processor

import (
	"bytes"
	"image"
	"image/jpeg"
	"testing"
)

func TestImageProcessor_ProcessImage(t *testing.T) {
	processor := NewImageProcessor()

	// Create a simple test image
	img := image.NewRGBA(image.Rect(0, 0, 1000, 600))
	var buf bytes.Buffer
	if err := jpeg.Encode(&buf, img, nil); err != nil {
		t.Fatalf("Failed to encode test image: %v", err)
	}

	processed, err := processor.ProcessImage(buf.Bytes())
	if err != nil {
		t.Fatalf("ProcessImage failed: %v", err)
	}

	// Verify dimensions
	if processed.Width != 1000 || processed.Height != 600 {
		t.Errorf("Expected dimensions 1000x600, got %dx%d", processed.Width, processed.Height)
	}

	// Verify format
	if processed.Format != "jpeg" {
		t.Errorf("Expected format 'jpeg', got '%s'", processed.Format)
	}

	// Verify all image variants are created
	if len(processed.Original) == 0 {
		t.Error("Original image data is empty")
	}
	if len(processed.Medium) == 0 {
		t.Error("Medium image data is empty")
	}
	if len(processed.Thumbnail) == 0 {
		t.Error("Thumbnail image data is empty")
	}
}

func TestImageProcessor_ValidateImageFormat(t *testing.T) {
	processor := NewImageProcessor()

	validFormats := []string{"image/jpeg", "image/jpg", "image/png"}
	for _, format := range validFormats {
		if err := processor.ValidateImageFormat(format); err != nil {
			t.Errorf("Expected format '%s' to be valid, got error: %v", format, err)
		}
	}

	invalidFormats := []string{"image/gif", "image/bmp", "text/plain"}
	for _, format := range invalidFormats {
		if err := processor.ValidateImageFormat(format); err == nil {
			t.Errorf("Expected format '%s' to be invalid", format)
		}
	}
}

func TestImageProcessor_GetFileExtension(t *testing.T) {
	processor := NewImageProcessor()

	tests := []struct {
		format   string
		expected string
	}{
		{"jpeg", ".jpg"},
		{"png", ".png"},
		{"unknown", ".jpg"}, // default
	}

	for _, test := range tests {
		result := processor.GetFileExtension(test.format)
		if result != test.expected {
			t.Errorf("GetFileExtension(%s) = %s, expected %s", test.format, result, test.expected)
		}
	}
}