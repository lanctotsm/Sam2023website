import { notFound } from "next/navigation";
import Image from "next/image";
import { serverFetch, getServerUser } from "@/lib/server";
import type { Album, Image as AlbumImage } from "@/lib/api";
import { buildThumbUrl, buildLargeUrl } from "@/lib/images";

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
    <div className="grid gap-4">
      <header>
        <h1 className="text-chestnut">{album.title}</h1>
        <p className="text-chestnut-dark">{album.description}</p>
        <p className="text-olive">{images.length} photos</p>
      </header>
      {images.length === 0 ? (
        <p className="rounded-xl border border-desert-tan-dark bg-surface p-4 text-olive shadow-[0_2px_8px_rgba(72,9,3,0.08)]">
          {user ? "This album is empty. Upload a photo to get started." : "This album is empty."}
        </p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
          {images.map((image) => (
            <figure className="m-0 rounded-xl border border-desert-tan-dark bg-surface p-3 shadow-[0_2px_8px_rgba(72,9,3,0.08)] transition-all hover:-translate-y-0.5 hover:border-caramel hover:shadow-[0_8px_24px_rgba(72,9,3,0.15)]" key={image.id}>
              <a href={buildLargeUrl(image)} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg">
                <Image
                  src={buildThumbUrl(image)}
                  alt={image.alt_text || image.caption || "Album image"}
                  width={image.width || 600}
                  height={image.height || 400}
                  className="block w-full object-cover"
                  style={{ height: "220px" }}
                  unoptimized
                />
              </a>
              {image.caption && <figcaption className="mt-2 text-sm text-olive-dark">{image.caption}</figcaption>}
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
