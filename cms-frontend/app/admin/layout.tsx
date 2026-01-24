import Link from "next/link";
import type { ReactNode } from "react";
import AdminLoginButton from "@/components/AdminLoginButton";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="stack">
      <header className="card">
        <h1>Admin</h1>
        <nav className="stack">
          <Link href="/admin/posts">Posts</Link>
          <Link href="/admin/albums">Albums</Link>
          <Link href="/admin/media">Media</Link>
        </nav>
        <AdminLoginButton />
      </header>
      {children}
    </div>
  );
}
