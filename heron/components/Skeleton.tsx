export function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton ${className || ""}`} aria-hidden />;
}

export function SkeletonCircle({ className }: { className?: string }) {
  return <div className={`skeleton skeleton--circle ${className || ""}`} aria-hidden />;
}

export function SkeletonTitle({ className }: { className?: string }) {
  return <div className={`skeleton skeleton--title ${className || ""}`} aria-hidden />;
}

export function SkeletonText({ className, short }: { className?: string; short?: boolean }) {
  return (
    <div
      className={`skeleton skeleton--text ${short ? "skeleton--text-short" : ""} ${className || ""}`}
      aria-hidden
    />
  );
}

export function SkeletonImage({ className }: { className?: string }) {
  return <div className={`skeleton skeleton--image ${className || ""}`} aria-hidden />;
}

export function SkeletonCard() {
  return (
    <div className="card space-y-4">
      <SkeletonImage />
      <SkeletonTitle />
      <SkeletonText />
      <SkeletonText short />
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="flex gap-4">
      <SkeletonCircle />
      <div className="flex-1 space-y-2">
        <SkeletonTitle className="mb-0" />
        <SkeletonText className="mb-0" />
      </div>
    </div>
  );
}
// Compatibility aliases
export const MediaItemSkeleton = SkeletonCard;
export const AlbumCardSkeleton = SkeletonCard;
export const PostCardSkeleton = SkeletonCard;
