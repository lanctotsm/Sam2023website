import { PostCardSkeleton } from "@/components/Skeleton";

export default function PostsLoading() {
  return (
    <div className="grid gap-4">
      <div className="h-8 w-32 animate-pulse rounded bg-desert-tan-dark/40 dark:bg-dark-muted/40" />
      <div className="grid gap-4 md:grid-cols-2">
        <PostCardSkeleton />
        <PostCardSkeleton />
        <PostCardSkeleton />
        <PostCardSkeleton />
      </div>
    </div>
  );
}
