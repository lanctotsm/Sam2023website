"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSession } from "next-auth/react";

/**
 * The album page itself does not read the session, so it can be cached.
 * This island fills in the edit link after hydration for a signed-in admin.
 * `getSession` does not need the root SessionProvider, which public pages omit.
 */
const buttonClass =
  "rounded-lg border border-chestnut bg-transparent px-4 py-2 text-chestnut transition hover:bg-chestnut/5 dark:border-dark-text dark:text-dark-text dark:hover:bg-dark-bg";

export default function ManageAlbumLink({
  albumId,
  label = "Manage album",
  className = buttonClass
}: {
  albumId: number;
  label?: string;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getSession()
      .then((session) => {
        if (cancelled) return;
        const user = session?.user?.email && session.user.id != null;
        setVisible(Boolean(user));
      })
      .catch(() => {
        if (!cancelled) setVisible(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!visible) return null;

  return (
    <Link href={`/admin/albums/${albumId}`} className={className}>
      {label}
    </Link>
  );
}
