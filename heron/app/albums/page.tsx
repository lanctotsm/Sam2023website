import Link from "next/link";
import { serverFetch } from "@/lib/server";
import type { Album, Image } from "@/lib/api";
import { buildThumbUrl } from "@/lib/images";
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
      <div className="grid gap-6">
        <h1 className="heading-rule text-[var(--page-h1-color,var(--color-chestnut))] dark:text-[var(--page-h1-color-dark,var(--color-dark-text))]" style={{ fontFamily: "var(--page-heading-font, var(--font-display))" }}>Albums</h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {albumCards.map(({ album, count, thumbnail }) => (
            <article key={album.id} className="surface-card">
              <Link
                href={`/albums/${album.slug}`}
                className="block overflow-hidden rounded-xl border border-desert-tan-dark bg-desert-tan-dark dark:border-dark-muted dark:bg-dark-bg"
              >
                {thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={buildThumbUrl(thumbnail)}
                    alt={thumbnail.alt_text || album.title}
                    className="block h-44 w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="grid h-44 place-items-center text-olive dark:text-dark-muted">
                    No photos yet
                  </div>
                )}
              </Link>
              <h2 className="mt-4 text-xl text-[var(--page-h2-color,var(--color-chestnut))] dark:text-[var(--page-h2-color-dark,var(--color-dark-text))]" style={{ fontFamily: "var(--page-heading-font, var(--font-display))" }}>{album.title}</h2>
              {album.description && (
                <p className="mt-1 text-sm leading-relaxed text-[var(--page-body-color,var(--color-chestnut-dark))] dark:text-[var(--page-body-color-dark,var(--color-dark-muted))]" style={{ fontFamily: "var(--page-body-font, inherit)" }}>{album.description}</p>
              )}
              <p className="mt-1 text-sm text-olive dark:text-dark-muted">{count} {count === 1 ? "photo" : "photos"}</p>
              <Link
                href={`/albums/${album.slug}`}
                className="mt-1 flex min-h-[44px] items-center text-sm font-medium text-[var(--page-link-color,var(--color-copper))] hover:opacity-80 dark:text-[var(--page-link-color-dark,var(--color-caramel-light))]"
              >
                View album →
              </Link>
            </article>
          ))}
        </div>
      </div>
    </PageStyleProvider>
  );
}
