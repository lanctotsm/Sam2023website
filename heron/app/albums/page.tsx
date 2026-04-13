import Link from "next/link";
import { serverFetch } from "@/lib/server";
import type { Album, Image } from "@/lib/api";
import { buildImageUrl } from "@/lib/images";
import PageStyleProvider from "@/components/PageStyleProvider";

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
    <PageStyleProvider page="albums">
      <div className="grid gap-4">
        <h1 className="text-[var(--page-h1-color,var(--color-chestnut))] dark:text-[var(--page-h1-color-dark,var(--color-dark-text))]" style={{ fontFamily: "var(--page-heading-font, inherit)" }}>Albums</h1>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
          {albumCards.map(({ album, count, thumbnail }) => (
            <article
              key={album.id}
              className="rounded-xl border border-[var(--page-card-border,var(--color-desert-tan-dark))] bg-[var(--page-card-bg,var(--color-surface))] p-4 shadow-[0_2px_8px_rgba(72,9,3,0.08)] dark:border-[var(--page-card-border-dark,var(--color-dark-muted))] dark:bg-[var(--page-card-bg-dark,var(--color-dark-surface))]"
            >
              <Link
                href={`/albums/${album.slug}`}
                className="block overflow-hidden rounded-xl border border-desert-tan-dark bg-desert-tan-dark dark:border-dark-muted dark:bg-dark-bg"
              >
                {thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={buildImageUrl(thumbnail.s3_key)} alt={thumbnail.alt_text || album.title} className="block h-44 w-full object-cover" />
                ) : (
                  <div className="grid h-44 place-items-center text-olive dark:text-dark-muted">
                    No photos yet
                  </div>
                )}
              </Link>
              <h2 className="mt-3 text-[var(--page-h2-color,var(--color-chestnut))] dark:text-[var(--page-h2-color-dark,var(--color-dark-text))]" style={{ fontFamily: "var(--page-heading-font, inherit)" }}>{album.title}</h2>
              <p className="text-[var(--page-body-color,var(--color-chestnut-dark))] dark:text-[var(--page-body-color-dark,var(--color-dark-muted))]" style={{ fontFamily: "var(--page-body-font, inherit)" }}>{album.description}</p>
              <p className="text-olive dark:text-dark-muted">{count} photos</p>
              <Link
                href={`/albums/${album.slug}`}
                className="font-medium text-[var(--page-link-color,var(--color-copper))] hover:opacity-80 dark:text-[var(--page-link-color-dark,var(--color-caramel-light))]"
              >
                View album
              </Link>
            </article>
          ))}
        </div>
      </div>
    </PageStyleProvider>
  );
}
