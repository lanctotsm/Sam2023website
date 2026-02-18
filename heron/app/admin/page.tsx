import Link from "next/link";
export default function AdminHomePage() {
  return (
    <div className="grid gap-4">
      <section className="rounded-xl border border-desert-tan-dark bg-surface p-4 shadow-[0_2px_8px_rgba(72,9,3,0.08)] dark:border-dark-muted dark:bg-dark-surface">
        <h2 className="m-0 text-chestnut dark:text-dark-text">Admin Home</h2>
        <p className="mt-2 text-chestnut-dark dark:text-dark-muted">
          Manage content from one place. Start with Albums for unified photo editing, or open the
          dashboard for site-wide stats.
        </p>
      </section>

      <section className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
        <Link
          href="/admin/dashboard"
          className="rounded-xl border border-desert-tan-dark bg-surface p-5 text-chestnut shadow-[0_2px_8px_rgba(72,9,3,0.08)] transition-all hover:-translate-y-0.5 hover:border-caramel dark:border-dark-muted dark:bg-dark-surface dark:text-dark-text dark:hover:border-caramel/50"
        >
          <p className="m-0 text-xs uppercase tracking-wide text-olive-dark dark:text-dark-muted">Overview</p>
          <h3 className="mb-0 mt-2 text-lg">Dashboard</h3>
        </Link>
        <Link
          href="/admin/albums"
          className="rounded-xl border border-desert-tan-dark bg-surface p-5 text-chestnut shadow-[0_2px_8px_rgba(72,9,3,0.08)] transition-all hover:-translate-y-0.5 hover:border-caramel dark:border-dark-muted dark:bg-dark-surface dark:text-dark-text dark:hover:border-caramel/50"
        >
          <p className="m-0 text-xs uppercase tracking-wide text-olive-dark dark:text-dark-muted">Photos</p>
          <h3 className="mb-0 mt-2 text-lg">Albums</h3>
        </Link>
        <Link
          href="/admin/posts"
          className="rounded-xl border border-desert-tan-dark bg-surface p-5 text-chestnut shadow-[0_2px_8px_rgba(72,9,3,0.08)] transition-all hover:-translate-y-0.5 hover:border-caramel dark:border-dark-muted dark:bg-dark-surface dark:text-dark-text dark:hover:border-caramel/50"
        >
          <p className="m-0 text-xs uppercase tracking-wide text-olive-dark dark:text-dark-muted">Writing</p>
          <h3 className="mb-0 mt-2 text-lg">Posts</h3>
        </Link>
        <Link
          href="/admin/media"
          className="rounded-xl border border-desert-tan-dark bg-surface p-5 text-chestnut shadow-[0_2px_8px_rgba(72,9,3,0.08)] transition-all hover:-translate-y-0.5 hover:border-caramel dark:border-dark-muted dark:bg-dark-surface dark:text-dark-text dark:hover:border-caramel/50"
        >
          <p className="m-0 text-xs uppercase tracking-wide text-olive-dark dark:text-dark-muted">Library</p>
          <h3 className="mb-0 mt-2 text-lg">Media</h3>
        </Link>
        <Link
          href="/admin/users"
          className="rounded-xl border border-desert-tan-dark bg-surface p-5 text-chestnut shadow-[0_2px_8px_rgba(72,9,3,0.08)] transition-all hover:-translate-y-0.5 hover:border-caramel dark:border-dark-muted dark:bg-dark-surface dark:text-dark-text dark:hover:border-caramel/50"
        >
          <p className="m-0 text-xs uppercase tracking-wide text-olive-dark dark:text-dark-muted">Access</p>
          <h3 className="mb-0 mt-2 text-lg">Users</h3>
        </Link>
      </section>
      <section className="rounded-xl border border-desert-tan-dark bg-surface p-4 shadow-[0_2px_8px_rgba(72,9,3,0.08)] dark:border-dark-muted dark:bg-dark-surface">
        <h2 className="text-chestnut dark:text-dark-text">Quick Actions</h2>
        <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
          <Link
            href="/admin/posts"
            className="flex flex-col items-center gap-2 rounded-xl border border-desert-tan-dark bg-white p-5 text-chestnut transition-all hover:-translate-y-0.5 hover:border-caramel hover:bg-desert-tan dark:border-dark-muted dark:bg-dark-bg dark:text-dark-text dark:hover:border-caramel/50 dark:hover:bg-dark-surface"
          >
            <span className="text-3xl">📝</span>
            <span>Edit Posts</span>
          </Link>
          <Link
            href="/upload"
            className="flex flex-col items-center gap-2 rounded-xl border border-desert-tan-dark bg-white p-5 text-chestnut transition-all hover:-translate-y-0.5 hover:border-caramel hover:bg-desert-tan dark:border-dark-muted dark:bg-dark-bg dark:text-dark-text dark:hover:border-caramel/50 dark:hover:bg-dark-surface"
          >
            <span className="text-3xl">📷</span>
            <span>Upload</span>
          </Link>
          <Link
            href="/admin/albums"
            className="flex flex-col items-center gap-2 rounded-xl border border-desert-tan-dark bg-white p-5 text-chestnut transition-all hover:-translate-y-0.5 hover:border-caramel hover:bg-desert-tan dark:border-dark-muted dark:bg-dark-bg dark:text-dark-text dark:hover:border-caramel/50 dark:hover:bg-dark-surface"
          >
            <span className="text-3xl">📁</span>
            <span>Open Albums</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
