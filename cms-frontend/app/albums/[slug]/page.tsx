import { notFound } from "next/navigation";
import Image from "next/image";
import { serverFetch, getServerUser } from "@/lib/server";
import type { Album, Image as AlbumImage } from "@/lib/api";
import { buildImageUrl } from "@/lib/images";

type PageProps = {
  params: { slug: string };
};

export default async function AlbumDetailPage({ params }: PageProps) {
  try {
    const album = await serverFetch<Album>(`/albums/slug/${params.slug}`);
    const images = await serverFetch<AlbumImage[]>(`/albums/${album.id}/images`);
    const user = await getServerUser();

    return (
      <div className="stack">
        <header>
          <h1>{album.title}</h1>
          <p>{album.description}</p>
          <p className="muted">{images.length} photos</p>
        </header>
        {images.length === 0 ? (
          <p className="card">
            {user
              ? "This album is empty. Upload a photo to get started."
              : "This album is empty."}
          </p>
        ) : (
          <div className="grid photo-grid">
            {images.map((image) => (
              <figure className="card" key={image.id}>
                <a href={buildImageUrl(image.s3_key)} target="_blank" rel="noreferrer">
                  <Image
                    src={buildImageUrl(image.s3_key)}
                    alt={image.alt_text || image.caption || "Album image"}
                    width={image.width || 600}
                    height={image.height || 400}
                    style={{ width: "100%", height: "auto" }}
                  />
                </a>
                {image.caption && <figcaption>{image.caption}</figcaption>}
              </figure>
            ))}
          </div>
        )}
      </div>
    );
  } catch {
    notFound();
  }
}
