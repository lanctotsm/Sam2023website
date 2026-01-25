package store

import (
	"context"
	"database/sql"
)

type AlbumImage struct {
	AlbumID   int64
	ImageID   int64
	SortOrder int
}

type LinkStore struct {
	db *sql.DB
}

func (s *LinkStore) LinkPostToAlbum(ctx context.Context, postID, albumID int64) error {
	_, err := s.db.ExecContext(ctx, `
		INSERT INTO post_album_links (post_id, album_id)
		VALUES ($1, $2)
		ON CONFLICT DO NOTHING;`, postID, albumID)
	return err
}

func (s *LinkStore) ListAlbumsForPost(ctx context.Context, postID int64) ([]Album, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT a.id, a.title, a.slug, a.description, a.created_by, a.created_at, a.updated_at
		FROM albums a
		INNER JOIN post_album_links l ON l.album_id = a.id
		WHERE l.post_id = $1
		ORDER BY a.created_at DESC;`, postID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	albums := []Album{}
	for rows.Next() {
		album, err := scanAlbum(rows)
		if err != nil {
			return nil, err
		}
		albums = append(albums, *album)
	}
	return albums, rows.Err()
}

func (s *LinkStore) LinkImageToAlbum(ctx context.Context, albumID, imageID int64, sortOrder int) error {
	_, err := s.db.ExecContext(ctx, `
		INSERT INTO album_images (album_id, image_id, sort_order)
		VALUES ($1, $2, $3)
		ON CONFLICT (album_id, image_id)
		DO UPDATE SET sort_order = EXCLUDED.sort_order;`, albumID, imageID, sortOrder)
	return err
}

func (s *LinkStore) ListImagesForAlbum(ctx context.Context, albumID int64) ([]Image, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT i.id, i.s3_key, i.width, i.height, i.caption, i.alt_text, i.created_by, i.created_at
		FROM images i
		INNER JOIN album_images ai ON ai.image_id = i.id
		WHERE ai.album_id = $1
		ORDER BY ai.sort_order ASC, i.created_at DESC;`, albumID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	images := []Image{}
	for rows.Next() {
		image, err := scanImage(rows)
		if err != nil {
			return nil, err
		}
		images = append(images, *image)
	}
	return images, rows.Err()
}
