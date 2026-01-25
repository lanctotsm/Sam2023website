import Link from "next/link";
import type { ReactNode } from "react";
import AdminLoginButton from "@/components/AdminLoginButton";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="stack">
      <header className="card">
        <div className="admin-header">
          <h1>Admin Dashboard</h1>
          <AdminLoginButton />
        </div>
        <nav className="admin-nav">
          <Link href="/admin/posts">Posts</Link>
          <Link href="/admin/albums">Albums</Link>
          <Link href="/admin/media">Media Library</Link>
          <Link href="/upload">Upload Photos</Link>
        </nav>
      </header>
      {children}
    </div>
  );
}
