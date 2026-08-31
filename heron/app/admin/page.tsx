import Link from "next/link";
import AdminQuickActions from "@/components/admin/AdminQuickActions";
import { ADMIN_HOME_TILES, adminCardClass, adminHomeTileClass } from "@/lib/admin-ui";

export default function AdminHomePage() {
  return (
    <div className="grid gap-4">
      <section className={adminCardClass}>
        <h2 className="m-0 text-chestnut dark:text-dark-text">Admin Home</h2>
        <p className="mt-2 text-chestnut-dark dark:text-dark-muted">
          Manage content from one place. Start with Albums for unified photo editing, or open the
          dashboard for site-wide stats.
        </p>
      </section>

      <section className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
        {ADMIN_HOME_TILES.map((tile) => (
          <Link key={tile.href} href={tile.href} className={adminHomeTileClass}>
            <p className="m-0 text-xs uppercase tracking-wide text-olive-dark dark:text-dark-muted">{tile.kicker}</p>
            <h3 className="mb-0 mt-2 text-lg">{tile.label}</h3>
          </Link>
        ))}
      </section>
      <AdminQuickActions />
    </div>
  );
}
