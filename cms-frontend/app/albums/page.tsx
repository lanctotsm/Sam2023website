import Link from "next/link";
import { serverFetch, getServerUser } from "@/lib/server";
import type { Album, Image } from "@/lib/api";
import CreateAlbumForm from "@/components/CreateAlbumForm";
import { buildImageUrl } from "@/lib/images";

export const dynamic = "force-dynamic";

export default async function AlbumsPage() {
  const albumsData = await serverFetch<Album[]>("/albums");
  const albums = albumsData || [];
  const user = await getServerUser();
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
    <div className="stack">
      <h1>Albums</h1>
      {user && <CreateAlbumForm />}
      <div className="grid album-grid">
        {albumCards.map(({ album, count, thumbnail }) => (
          <article className="card album-card" key={album.id}>
            <Link href={`/albums/${album.slug}`} className="album-thumb">
              {thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={buildImageUrl(thumbnail.s3_key)} alt={thumbnail.alt_text || album.title} />
              ) : (
                <div className="placeholder">No photos yet</div>
              )}
            </Link>
            <h2>{album.title}</h2>
            <p>{album.description}</p>
            <p className="muted">{count} photos</p>
            <Link className="text-link" href={`/albums/${album.slug}`}>
              View album
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
