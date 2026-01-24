import Link from "next/link";
import { serverFetch } from "@/lib/server";
import type { Album } from "@/lib/api";

export default async function AlbumsPage() {
  const albums = await serverFetch<Album[]>("/albums");

  return (
    <div className="stack">
      <h1>Albums</h1>
      <div className="grid">
        {albums.map((album) => (
          <article className="card" key={album.id}>
            <h2>{album.title}</h2>
            <p>{album.description}</p>
            <Link href={`/albums/${album.slug}`}>View album</Link>
          </article>
        ))}
      </div>
    </div>
  );
}
