"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

type SearchResult = {
  posts: { id: number; title: string; slug: string; summary: string }[];
  albums: { id: number; title: string; slug: string; description: string }[];
};

const DEBOUNCE_MS = 280;

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      setResults(data);
    } catch {
      setResults({ posts: [], albums: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults(null);
      setLoading(false);
      return;
    }
    debounceRef.current = setTimeout(() => runSearch(query), DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showDropdown = open && query.trim() !== "" && (loading || results !== null);

  return (
    <div className="relative" ref={containerRef}>
      <input
        type="search"
        placeholder="Search posts & albums..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        className="w-44 rounded-lg border border-desert-tan-dark bg-white/90 px-3 py-1.5 text-sm text-chestnut-dark placeholder:text-olive/70 focus:border-chestnut focus:outline-none focus:ring-2 focus:ring-chestnut/10 dark:border-dark-muted dark:bg-dark-bg dark:text-dark-text dark:placeholder:text-dark-muted"
        aria-label="Search"
      />
      {showDropdown && (
        <div className="absolute top-full left-0 z-50 mt-1 w-80 rounded-xl border border-desert-tan-dark bg-surface py-2 shadow-lg dark:border-dark-muted dark:bg-dark-surface">
          {loading ? (
            <div className="px-4 py-6 text-center text-sm text-olive dark:text-dark-muted">Searching...</div>
          ) : results ? (
            <>
              {results.posts.length === 0 && results.albums.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-olive dark:text-dark-muted">No results.</div>
              ) : (
                <>
                  {results.posts.length > 0 && (
                    <div className="px-2">
                      <p className="mb-1 px-2 text-xs font-semibold uppercase text-olive-dark dark:text-dark-muted">Posts</p>
                      {results.posts.slice(0, 5).map((post) => (
                        <Link
                          key={post.id}
                          href={`/posts/${post.slug}`}
                          className="block rounded-lg px-3 py-2 text-sm text-chestnut-dark transition hover:bg-surface-hover dark:text-dark-text dark:hover:bg-dark-bg"
                          onClick={() => setOpen(false)}
                        >
                          {post.title}
                        </Link>
                      ))}
                    </div>
                  )}
                  {results.albums.length > 0 && (
                    <div className="mt-2 border-t border-desert-tan-dark px-2 dark:border-dark-muted">
                      <p className="mb-1 mt-2 px-2 text-xs font-semibold uppercase text-olive-dark dark:text-dark-muted">Albums</p>
                      {results.albums.slice(0, 5).map((album) => (
                        <Link
                          key={album.id}
                          href={`/albums/${album.slug}`}
                          className="block rounded-lg px-3 py-2 text-sm text-chestnut-dark transition hover:bg-surface-hover dark:text-dark-text dark:hover:bg-dark-bg"
                          onClick={() => setOpen(false)}
                        >
                          {album.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
