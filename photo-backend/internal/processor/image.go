// Package processor provides image processing capabilities for the photo management system.
// It handles image resizing, format conversion, and thumbnail generation using
// efficient algorithms optimized for web display and storage.
package processor

import (
	"bytes"
	"fmt"
	"image"
	"image/jpeg"
	"image/png"

	"github.com/disintegration/imaging"
)

const (
	// Image processing constants
	MediumMaxSize = 800 // Maximum dimension for medium-sized images
	ThumbnailSize = 200 // Square thumbnail size in pixels
	JPEGQuality   = 85  // JPEG compression quality (0-100)
)

// ImageProcessor handles image processing operations including resizing,
// format validation, and thumbnail generation for uploaded photos.
type ImageProcessor struct{}

// NewImageProcessor creates a new ImageProcessor instance.
func NewImageProcessor() *ImageProcessor {
	return &ImageProcessor{}
}

// ProcessedImage contains the processed image data with all variants.
type ProcessedImage struct {
	Original  []byte
	Medium    []byte
	Thumbnail []byte
	Width     int
	Height    int
	Format    string
}

// ProcessImage processes an image and creates different sizes.
func (p *ImageProcessor) ProcessImage(imageData []byte) (*ProcessedImage, error) {
	// Decode the original image
	img, format, err := image.Decode(bytes.NewReader(imageData))
	if err != nil {
		return nil, fmt.Errorf("failed to decode image: %w", err)
	}

	bounds := img.Bounds()
	width := bounds.Dx()
	height := bounds.Dy()

	// Create medium size image (max 800px)
	mediumImg := imaging.Fit(img, MediumMaxSize, MediumMaxSize, imaging.Lanczos)
	mediumData, err := p.encodeImage(mediumImg, format)
	if err != nil {
		return nil, fmt.Errorf("failed to encode medium image: %w", err)
	}

	// Create thumbnail (200x200 square)
	thumbnailImg := imaging.Fill(img, ThumbnailSize, ThumbnailSize, imaging.Center, imaging.Lanczos)
	thumbnailData, err := p.encodeImage(thumbnailImg, format)
	if err != nil {
		return nil, fmt.Errorf("failed to encode thumbnail: %w", err)
	}

	return &ProcessedImage{
		Original:  imageData,
		Medium:    mediumData,
		Thumbnail: thumbnailData,
		Width:     width,
		Height:    height,
		Format:    format,
	}, nil
}

// encodeImage encodes an image to the specified format
func (p *ImageProcessor) encodeImage(img image.Image, format string) ([]byte, error) {
	var buf bytes.Buffer
	
	switch format {
	case "jpeg":
		if err := jpeg.Encode(&buf, img, &jpeg.Options{Quality: JPEGQuality}); err != nil {
			return nil, fmt.Errorf("failed to encode JPEG: %w", err)
		}
	case "png":
		if err := png.Encode(&buf, img); err != nil {
			return nil, fmt.Errorf("failed to encode PNG: %w", err)
		}
	default:
		return nil, fmt.Errorf("unsupported image format: %s", format)
	}
	
	return buf.Bytes(), nil
}

// GetFileExtension returns the file extension for a given format
func (p *ImageProcessor) GetFileExtension(format string) string {
	switch format {
	case "jpeg":
		return ".jpg"
	case "png":
		return ".png"
	default:
		return ".jpg"
	}
}

// ValidateImageFormat checks if the image format is supported
func (p *ImageProcessor) ValidateImageFormat(contentType string) error {
	switch contentType {
	case "image/jpeg", "image/jpg", "image/png":
		return nil
	default:
		return fmt.Errorf("unsupported content type: %s", contentType)
	}
}