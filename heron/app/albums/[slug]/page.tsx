import Link from "next/link";
import { notFound } from "next/navigation";
import AlbumViewer from "@/components/AlbumViewer";
import ManageAlbumLink from "@/components/ManageAlbumLink";
import { skipEmptyProductionBuild } from "@/lib/skip-empty-build";
import { getCachedAlbumImages, getCachedPublicAlbum } from "@/services/public-content";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 3600;

export default async function AlbumDetailPage({ params }: PageProps) {
  await skipEmptyProductionBuild();
  const { slug } = await params;
  const album = await getCachedPublicAlbum(slug);
  if (!album) notFound();
  const images = await getCachedAlbumImages(album.id);

  return (
    <div className="grid gap-4">
      <Link
        href="/albums"
        className="tap-inline inline-flex items-center gap-1.5 self-start text-sm font-medium text-copper transition-colors hover:text-chestnut dark:text-caramel-light dark:hover:text-desert-tan"
      >
        ← Back to Albums
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="heading-rule text-chestnut dark:text-dark-text">{album.title}</h1>
          {album.description && (
            <p className="mt-3 text-chestnut-dark dark:text-dark-muted">{album.description}</p>
          )}
          <p className="mt-1 text-sm text-olive dark:text-dark-muted">
            {images.length} {images.length === 1 ? "photo" : "photos"}
          </p>
        </div>
        <ManageAlbumLink albumId={album.id} />
      </header>

      {images.length === 0 ? (
        <p className="rounded-xl border border-desert-tan-dark bg-surface p-4 text-olive shadow-[0_2px_8px_rgba(72,9,3,0.08)] dark:border-dark-muted dark:bg-dark-surface dark:text-dark-muted">
          This album is empty.{" "}
          <ManageAlbumLink
            albumId={album.id}
            label="Add photos"
            className="font-medium text-chestnut hover:underline dark:text-caramel-light dark:hover:text-desert-tan"
          />
        </p>
      ) : (
        <AlbumViewer images={images} />
      )}
    </div>
  );
}
