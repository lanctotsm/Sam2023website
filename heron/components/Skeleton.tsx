const baseClass =
  "animate-pulse rounded-md bg-desert-tan-dark/40 dark:bg-dark-muted/40";

export function Skeleton({
  className = "",
  ...props
}: React.ComponentProps<"div"> & { className?: string }) {
  return <div className={`${baseClass} ${className}`} {...props} />;
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-desert-tan-dark bg-surface p-4 shadow-[0_2px_8px_rgba(72,9,3,0.08)] dark:border-dark-muted dark:bg-dark-surface">
      <Skeleton className="mb-2 h-4 w-20" />
      <Skeleton className="mb-3 h-10 w-16" />
      <Skeleton className="h-4 w-24" />
    </div>
  );
}

export function PostCardSkeleton() {
  return (
    <article className="rounded-xl border border-desert-tan-dark bg-surface p-4 shadow-[0_2px_8px_rgba(72,9,3,0.08)] dark:border-dark-muted dark:bg-dark-surface">
      <Skeleton className="h-6 w-[75%]" />
      <Skeleton className="mt-2 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-2/3" />
      <Skeleton className="mt-3 h-4 w-24" />
    </article>
  );
}

export function AlbumCardSkeleton() {
  return (
    <article className="rounded-xl border border-desert-tan-dark bg-surface p-4 shadow-[0_2px_8px_rgba(72,9,3,0.08)] dark:border-dark-muted dark:bg-dark-surface">
      <Skeleton className="h-44 w-full rounded-xl" />
      <Skeleton className="mt-3 h-5 w-2/3" />
      <Skeleton className="mt-2 h-4 w-full" />
      <Skeleton className="mt-1 h-4 w-20" />
      <Skeleton className="mt-2 h-4 w-24" />
    </article>
  );
}

export function MediaItemSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-desert-tan-dark bg-surface p-4 shadow-[0_2px_8px_rgba(72,9,3,0.08)] dark:border-dark-muted dark:bg-dark-surface">
      <Skeleton className="h-[150px] w-full rounded-lg" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-8 w-16" />
    </div>
  );
}
