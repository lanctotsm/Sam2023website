import Link from "next/link";
import { buildImageUrl } from "@/lib/images";
import PageStyleProvider from "@/components/PageStyleProvider";
import WideColumn from "@/components/WideColumn";
import { formatPostDate } from "@/lib/format-post-date";
import { skipEmptyProductionBuild } from "@/lib/skip-empty-build";
import { getCachedPublicAlbums } from "@/services/public-content";

function albumDate(value: string | null | undefined): string {
  if (!value) return "";
  const day = value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return value;
  return formatPostDate(`${day}T12:00:00`);
}

export const revalidate = 3600;

export default async function AlbumsPage() {
  await skipEmptyProductionBuild();
  const albums = await getCachedPublicAlbums();

  return (
    <PageStyleProvider page="albums">
      <WideColumn>
      <div className="grid gap-6">
        <h1 className="heading-rule text-[var(--page-h1-color,var(--color-chestnut))] dark:text-[var(--page-h1-color-dark,var(--color-dark-text))]" style={{ fontFamily: "var(--page-heading-font, var(--font-display))" }}>Albums</h1>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((album) => {
            const count = album.photo_count ?? 0;
            const date = albumDate(album.display_date);
            return (
            <Link
              key={album.id}
              href={`/albums/${album.slug}`}
              className="surface-card group block overflow-hidden !p-0 transition-all hover:-translate-y-0.5 hover:shadow-card-hover dark:hover:shadow-none"
            >
              {album.cover_image_s3_key ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={buildImageUrl(album.cover_image_s3_key)}
                  alt=""
                  className="block h-64 w-full object-cover sm:h-72"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="grid h-64 place-items-center bg-desert-tan-dark text-olive sm:h-72 dark:bg-dark-bg dark:text-dark-muted">
                  No photos yet
                </div>
              )}
              <div className="p-4 sm:p-5">
                <h2 className="text-xl text-[var(--page-h2-color,var(--color-chestnut))] dark:text-[var(--page-h2-color-dark,var(--color-dark-text))]" style={{ fontFamily: "var(--page-heading-font, var(--font-display))" }}>{album.title}</h2>
                {album.description && (
                  <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[var(--page-body-color,var(--color-chestnut-dark))] dark:text-[var(--page-body-color-dark,var(--color-dark-muted))]" style={{ fontFamily: "var(--page-body-font, inherit)" }}>{album.description}</p>
                )}
                <p className="mt-2 text-sm text-olive dark:text-dark-muted">
                  {count} {count === 1 ? "photo" : "photos"}
                  {date ? ` · ${date}` : ""}
                </p>
              </div>
            </Link>
            );
          })}
        </div>
      </div>
      </WideColumn>
    </PageStyleProvider>
  );
}
