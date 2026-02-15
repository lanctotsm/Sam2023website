import { AlbumCardSkeleton } from "@/components/Skeleton";

export default function AlbumsLoading() {
  return (
    <div className="grid gap-4">
      <div className="h-8 w-24 animate-pulse rounded bg-desert-tan-dark/40 dark:bg-dark-muted/40" />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
        <AlbumCardSkeleton />
        <AlbumCardSkeleton />
        <AlbumCardSkeleton />
        <AlbumCardSkeleton />
        <AlbumCardSkeleton />
        <AlbumCardSkeleton />
      </div>
    </div>
  );
}
