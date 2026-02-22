import Link from "next/link";
import { serverFetch } from "@/lib/server";
import type { Album, Image } from "@/lib/api";
import { buildImageUrl } from "@/lib/images";

export const dynamic = "force-dynamic";

export default async function AlbumsPage() {
  const albumsData = await serverFetch<Album[]>("/albums");
  const albums = albumsData || [];
  const albumCards = await Promise.all(
    albums.map(async (album) => {
      const imagesData = await serverFetch<Image[]>(`/albums/${album.id}/images`);
      const images = imagesData || [];
      return {
        album,
        images,
        count: images.length,
        thumbnail: images[0]
      };
    })
  );

  return (
    <article className="grid gap-6">
      <header className="section-header">
        <h1 className="section-header__title">Albums</h1>
      </header>

      <div className="album-list">
        {albumCards.map(({ album, count, thumbnail }) => (
          <section
            key={album.id}
            className="card album-card"
          >
            <Link
              href={`/albums/${album.slug}`}
              className="album-card__link"
            >
              {thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={buildImageUrl(thumbnail.s3_key)}
                  alt={thumbnail.alt_text || album.title}
                  className="album-card__image"
                />
              ) : (
                <div className="album-card__empty">
                  No photos yet
                </div>
              )}
            </Link>
            <div className="album-card__info">
              <h2 className="album-card__title">{album.title}</h2>
              <p className="album-card__desc">{album.description}</p>
              <p className="album-card__stats">{count} photos</p>
            </div>
            <Link
              href={`/albums/${album.slug}`}
              className="album-card__action"
            >
              View album →
            </Link>
          </section>
        ))}
      </div>
    </article>
  );
}
