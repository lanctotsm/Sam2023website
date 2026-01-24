import { notFound } from "next/navigation";
import Image from "next/image";
import { serverFetch } from "@/lib/server";
import type { Album, Image as AlbumImage } from "@/lib/api";

type PageProps = {
  params: { slug: string };
};

export default async function AlbumDetailPage({ params }: PageProps) {
  try {
    const album = await serverFetch<Album>(`/albums/slug/${params.slug}`);
    const images = await serverFetch<AlbumImage[]>(`/albums/${album.id}/images`);
    const baseURL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || "";

    return (
      <div className="stack">
        <header>
          <h1>{album.title}</h1>
          <p>{album.description}</p>
        </header>
        <div className="grid">
          {images.map((image) => (
            <figure className="card" key={image.id}>
              <Image
                src={`${baseURL}/${image.s3_key}`}
                alt={image.alt_text || image.caption || "Album image"}
                width={image.width || 600}
                height={image.height || 400}
                style={{ width: "100%", height: "auto" }}
              />
              <figcaption>{image.caption}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    );
  } catch {
    notFound();
  }
}
