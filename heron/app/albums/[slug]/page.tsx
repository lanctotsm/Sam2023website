import Link from "next/link";
import { notFound } from "next/navigation";
import { serverFetch } from "@/lib/server";
import { getAuthUser } from "@/lib/api-utils";
import type { Album, Image as AlbumImage } from "@/lib/api";
import AlbumViewer from "@/components/AlbumViewer";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export default async function AlbumDetailPage({ params }: PageProps) {
  const { slug } = await params;
  let album: Album;
  let images: AlbumImage[];
  let user: Awaited<ReturnType<typeof getAuthUser>>;
  try {
    album = await serverFetch<Album>(`/albums/slug/${slug}`);
    const imagesData = await serverFetch<AlbumImage[]>(`/albums/${album.id}/images`);
    images = imagesData || [];
    user = await getAuthUser();
  } catch {
    notFound();
  }

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
        {user && (
          <Link
            href={`/admin/albums/${album.id}`}
            className="rounded-lg border border-chestnut bg-transparent px-4 py-2 text-chestnut transition hover:bg-chestnut/5 dark:border-dark-text dark:text-dark-text dark:hover:bg-dark-bg"
          >
            Manage album
          </Link>
        )}
      </header>

      {images.length === 0 ? (
        <p className="rounded-xl border border-desert-tan-dark bg-surface p-4 text-olive shadow-[0_2px_8px_rgba(72,9,3,0.08)] dark:border-dark-muted dark:bg-dark-surface dark:text-dark-muted">
          {user ? (
            <>
              This album is empty.{" "}
              <Link href={`/admin/albums/${album.id}`} className="font-medium text-chestnut hover:underline dark:text-caramel-light dark:hover:text-desert-tan">
                Add photos
              </Link>
            </>
          ) : (
            "This album is empty."
          )}
        </p>
      ) : (
        <AlbumViewer images={images} />
      )}
    </div>
  );
}
