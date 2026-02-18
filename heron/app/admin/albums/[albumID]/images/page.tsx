"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function AdminAlbumImagesRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const albumID = params.albumID;

  useEffect(() => {
    if (typeof albumID === "string") {
      router.replace(`/admin/albums/${albumID}`);
    } else {
      router.replace("/admin/albums");
    }
  }, [albumID, router]);

  return (
    <div className="rounded-xl border border-desert-tan-dark bg-surface p-4 dark:border-dark-muted dark:bg-dark-surface">
      <p className="text-olive dark:text-dark-muted">Redirecting to album editor...</p>
    </div>
  );
}
