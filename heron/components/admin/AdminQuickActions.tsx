import Link from "next/link";
import { adminCardClass, adminQuickActionClass } from "@/lib/admin-ui";

type QuickAction = {
  href: string;
  emoji: string;
  label: string;
};

const DEFAULT_ACTIONS: QuickAction[] = [
  { href: "/admin/posts", emoji: "📝", label: "Edit Posts" },
  { href: "/upload", emoji: "📷", label: "Upload" },
  { href: "/admin/albums", emoji: "📁", label: "Open Albums" }
];

export default function AdminQuickActions({
  actions = DEFAULT_ACTIONS
}: {
  actions?: QuickAction[];
}) {
  return (
    <section className={adminCardClass}>
      <h2 className="text-chestnut dark:text-dark-text">Quick Actions</h2>
      <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
        {actions.map((action) => (
          <Link key={action.href} href={action.href} className={adminQuickActionClass}>
            <span className="text-3xl">{action.emoji}</span>
            <span>{action.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
