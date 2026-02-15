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
    <div className="grid gap-4">
      <h1 className="text-chestnut">Albums</h1>
      {user && <CreateAlbumForm />}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
        {albumCards.map(({ album, count, thumbnail }) => (
          <article key={album.id} className="rounded-xl border border-desert-tan-dark bg-surface p-4 shadow-[0_2px_8px_rgba(72,9,3,0.08)]">
            <Link href={`/albums/${album.slug}`} className="block overflow-hidden rounded-xl border border-desert-tan-dark bg-desert-tan-dark">
              {thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={buildImageUrl(thumbnail.s3_key)} alt={thumbnail.alt_text || album.title} className="block h-44 w-full object-cover" />
              ) : (
                <div className="grid h-44 place-items-center text-olive">No photos yet</div>
              )}
            </Link>
            <h2 className="mt-3 text-chestnut">{album.title}</h2>
            <p className="text-chestnut-dark">{album.description}</p>
            <p className="text-olive">{count} photos</p>
            <Link href={`/albums/${album.slug}`} className="font-medium text-copper hover:text-chestnut">View album</Link>
          </article>
        ))}
      </div>
    </div>
  );
}
