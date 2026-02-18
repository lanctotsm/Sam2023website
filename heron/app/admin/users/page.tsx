"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

type AdminUser = {
  id: number;
  name: string;
  email: string;
  is_base_admin: boolean;
  created_at: string;
};

const inputClass =
  "w-full rounded-lg border border-desert-tan-dark bg-white px-3 py-2.5 text-chestnut-dark outline-none transition focus:border-chestnut focus:ring-2 focus:ring-chestnut/10 dark:border-dark-muted dark:bg-dark-bg dark:text-dark-text dark:placeholder:text-dark-muted/60";
const cardClass =
  "rounded-xl border border-desert-tan-dark bg-surface p-4 shadow-[0_2px_8px_rgba(72,9,3,0.08)] dark:border-dark-muted dark:bg-dark-surface";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "" });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<AdminUser[]>("/admin/users");
      setUsers(data || []);
    } catch {
      setUsers([]);
      toast.error("Failed to load admin users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const createInvite = async () => {
    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    if (!name || !email) {
      toast.error("Name and email are required.");
      return;
    }
    setSaving(true);
    try {
      const created = await apiFetch<AdminUser>("/admin/users", {
        method: "POST",
        body: JSON.stringify({ name, email })
      });
      setUsers((prev) => [created, ...prev]);
      setForm({ name: "", email: "" });
      toast.success("Admin invite added.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to add admin";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const removeInvite = async (user: AdminUser) => {
    if (user.is_base_admin) {
      toast.error("Base admin cannot be removed.");
      return;
    }
    if (!confirm(`Remove admin access for ${user.email}?`)) return;
    try {
      await apiFetch(`/admin/users/${user.id}`, { method: "DELETE" });
      setUsers((prev) => prev.filter((x) => x.id !== user.id));
      toast.success("Admin removed.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to remove admin";
      toast.error(msg);
    }
  };

  return (
    <div className="grid gap-6">
      <section className={`${cardClass} flex flex-col gap-3`}>
        <h2 className="m-0 text-chestnut dark:text-dark-text">Invite Admin User</h2>
        <p className="m-0 text-sm text-olive dark:text-dark-muted">
          Add a name and email. Access is granted when they sign in with that Google account.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            className={inputClass}
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Full name"
          />
          <input
            className={inputClass}
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="Email address"
            type="email"
          />
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={createInvite}
          className="w-fit rounded-lg bg-chestnut px-4 py-2.5 text-desert-tan transition hover:bg-chestnut-dark disabled:opacity-60 dark:text-dark-text"
        >
          {saving ? "Adding..." : "Add Admin"}
        </button>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="m-0 text-chestnut dark:text-dark-text">Allowed Admins</h2>
        {loading ? (
          <p className={`${cardClass} text-olive dark:text-dark-muted`}>Loading...</p>
        ) : users.length === 0 ? (
          <p className={`${cardClass} text-olive dark:text-dark-muted`}>No admin users configured.</p>
        ) : (
          <div className="grid gap-3">
            {users.map((user) => (
              <article key={user.id} className={`${cardClass} flex flex-wrap items-center justify-between gap-4`}>
                <div className="min-w-0 flex-1">
                  <h3 className="m-0 text-base text-chestnut dark:text-dark-text">{user.name || "Unnamed admin"}</h3>
                  <p className="m-0 mt-1 truncate text-sm text-olive-dark dark:text-dark-muted">{user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {user.is_base_admin ? (
                    <span className="rounded-full bg-olive px-2.5 py-1 text-xs font-semibold uppercase text-white">
                      Base Admin
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => removeInvite(user)}
                      className="rounded border border-copper px-3 py-2 text-xs font-medium text-copper transition hover:bg-copper/10 dark:border-copper dark:text-copper-light dark:hover:bg-copper/20"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
