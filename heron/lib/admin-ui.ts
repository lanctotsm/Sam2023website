export const adminInputClass =
  "w-full rounded-lg border border-desert-tan-dark bg-white px-3 py-2.5 text-chestnut-dark outline-none transition focus:border-chestnut focus:ring-2 focus:ring-chestnut/10 dark:border-dark-muted dark:bg-dark-bg dark:text-dark-text dark:placeholder:text-dark-muted/60";

export const adminLabelClass = "text-sm font-medium text-chestnut-dark dark:text-dark-text";

export const adminCardClass =
  "rounded-xl border border-desert-tan-dark bg-surface p-4 shadow-[0_2px_8px_rgba(72,9,3,0.08)] dark:border-dark-muted dark:bg-dark-surface";

export const adminNavLinkClass =
  "rounded-lg border border-desert-tan-dark bg-white px-4 py-2 text-chestnut transition-colors hover:border-caramel hover:bg-desert-tan dark:border-dark-muted dark:bg-dark-bg dark:text-dark-text dark:hover:bg-dark-surface";

export const adminHomeTileClass =
  "rounded-xl border border-desert-tan-dark bg-surface p-5 text-chestnut shadow-[0_2px_8px_rgba(72,9,3,0.08)] transition-all hover:-translate-y-0.5 hover:border-caramel dark:border-dark-muted dark:bg-dark-surface dark:text-dark-text dark:hover:border-caramel/50";

export const adminQuickActionClass =
  "flex flex-col items-center gap-2 rounded-xl border border-desert-tan-dark bg-white p-5 text-chestnut transition-all hover:-translate-y-0.5 hover:border-caramel hover:bg-desert-tan dark:border-dark-muted dark:bg-dark-bg dark:text-dark-text dark:hover:border-caramel/50 dark:hover:bg-dark-surface";

export const adminCompactInputClass =
  "w-full rounded-lg border border-desert-tan-dark bg-white px-3 py-2 text-sm outline-none focus:border-chestnut dark:border-dark-muted dark:bg-dark-bg dark:text-dark-text dark:focus:border-caramel";

export const adminCompactLabelClass =
  "block text-sm font-semibold text-chestnut-dark dark:text-dark-text mb-1";

export const adminSectionClass =
  "rounded-xl border border-desert-tan-dark bg-surface p-5 shadow-[0_2px_8px_rgba(72,9,3,0.08)] dark:border-dark-muted dark:bg-dark-surface";

export const adminBtnDanger =
  "rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-sm text-red-700 transition-colors hover:bg-red-100 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50";

export const adminBtnAdd =
  "rounded-lg border border-desert-tan-dark bg-white px-4 py-2 text-sm font-medium text-chestnut transition-colors hover:bg-desert-tan dark:border-dark-muted dark:bg-dark-bg dark:text-dark-text dark:hover:bg-dark-surface";

export const ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "Home" },
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/posts", label: "Posts" },
  { href: "/admin/albums", label: "Albums" },
  { href: "/admin/media", label: "Media Library" },
  { href: "/admin/resume", label: "Resume" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/upload", label: "Upload Photos" }
] as const;

export const ADMIN_HOME_TILES = [
  { href: "/admin/dashboard", kicker: "Overview", label: "Dashboard" },
  { href: "/admin/albums", kicker: "Photos", label: "Albums" },
  { href: "/admin/posts", kicker: "Writing", label: "Posts" },
  { href: "/admin/media", kicker: "Library", label: "Media" },
  { href: "/admin/users", kicker: "Access", label: "Users" }
] as const;
