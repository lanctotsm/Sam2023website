import Link from "next/link";
import type { RecentWorkSectionData } from "@/lib/frontPageDefaults";
import { formatPostDate } from "@/lib/format-post-date";
import { getCachedPublicAlbums, getCachedPublicPosts } from "@/services/public-content";
import {
    homeBodyClass,
    homeBodyStyle,
    homeCardClass,
    homeHeadingStyle,
    homeSectionTitleClass,
} from "@/components/home/homeSectionStyles";

export async function RecentWorkSectionView({ data }: { data: RecentWorkSectionData }) {
    const albums = data.showAlbums ? (await getCachedPublicAlbums()).slice(0, data.albumLimit) : [];
    const posts = data.showPosts ? (await getCachedPublicPosts()).slice(0, data.postLimit) : [];

    return (
        <section className={homeCardClass} style={homeBodyStyle}>
            <h2 className={homeSectionTitleClass} style={homeHeadingStyle}>
                {data.heading}
            </h2>
            {albums.length === 0 && posts.length === 0 ? (
                <p className={`mt-4 ${homeBodyClass}`} style={homeBodyStyle}>
                    Nothing published yet.
                </p>
            ) : (
                <div className={`mt-4 grid gap-6 ${albums.length > 0 && posts.length > 0 ? "sm:grid-cols-2" : ""}`}>
                    {albums.length > 0 ? (
                        <div>
                            {posts.length > 0 ? (
                                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-olive dark:text-dark-muted">
                                    Albums
                                </h3>
                            ) : null}
                            <ul className="m-0 grid list-none gap-2 p-0">
                                {albums.map((album) => {
                                    const count = album.photo_count ?? 0;
                                    return (
                                        <li key={album.id}>
                                            <Link
                                                href={`/albums/${album.slug}`}
                                                className="font-medium text-[var(--page-link-color,var(--color-copper))] hover:opacity-80 dark:text-[var(--page-link-color-dark,var(--color-caramel-light))]"
                                            >
                                                {album.title}
                                            </Link>
                                            <span className={`ml-2 text-sm ${homeBodyClass}`} style={homeBodyStyle}>
                                                {count} {count === 1 ? "photo" : "photos"}
                                                {album.display_date ? ` · ${album.display_date}` : ""}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ) : null}
                    {posts.length > 0 ? (
                        <div>
                            {albums.length > 0 ? (
                                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-olive dark:text-dark-muted">
                                    Posts
                                </h3>
                            ) : null}
                            <ul className="m-0 grid list-none gap-2 p-0">
                                {posts.map((post) => (
                                    <li key={post.id}>
                                        <Link
                                            href={`/posts/${post.slug}`}
                                            className="font-medium text-[var(--page-link-color,var(--color-copper))] hover:opacity-80 dark:text-[var(--page-link-color-dark,var(--color-caramel-light))]"
                                        >
                                            {post.title}
                                        </Link>
                                        <span className={`ml-2 text-sm ${homeBodyClass}`} style={homeBodyStyle}>
                                            {formatPostDate(post.published_at || post.created_at)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : null}
                </div>
            )}
        </section>
    );
}
