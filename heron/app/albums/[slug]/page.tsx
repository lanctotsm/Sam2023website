import Link from "next/link";
import { notFound } from "next/navigation";
import { serverFetch, getServerUser } from "@/lib/server";
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
  let user: Awaited<ReturnType<typeof getServerUser>>;
  try {
    album = await serverFetch<Album>(`/albums/slug/${slug}`);
    const imagesData = await serverFetch<AlbumImage[]>(`/albums/${album.id}/images`);
    images = imagesData || [];
    user = await getServerUser();
  } catch {
    notFound();
  }

  return (
    <article className="album-detail">
      <Link
        href="/albums"
        className="album-detail__back"
      >
        ← Back to Albums
      </Link>

      <header className="album-detail__header">
        <div className="album-detail__info">
          <h1 className="album-detail__title">{album.title}</h1>
          <p className="album-detail__description">{album.description}</p>
          <p className="album-detail__stats">{images.length} photos</p>
        </div>
        {user && (
          <Link
            href={`/admin/albums/${album.id}`}
            className="album-detail__manage"
          >
            Manage album
          </Link>
        )}
      </header>

      <section className="album-detail__content">
        {images.length === 0 ? (
          <div className="album-detail__empty">
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
          </div>
        ) : (
          <AlbumViewer images={images} />
        )}
      </section>
    </article>
  );
}
