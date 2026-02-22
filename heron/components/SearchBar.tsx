"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { Post, Album } from "@/lib/api";

interface SearchResults {
  posts: Post[];
  albums: Album[];
}

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults(null);
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch<SearchResults>(
        `/search?q=${encodeURIComponent(searchQuery)}`
      );
      setResults(data);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (query.trim()) {
      timeoutRef.current = setTimeout(() => {
        performSearch(query);
      }, 300);
    } else {
      setResults(null);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [query, performSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasResults = results && (results.posts.length > 0 || results.albums.length > 0);

  return (
    <div className="relative" ref={containerRef}>
      <input
        type="search"
        placeholder="Search posts & albums..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowResults(true);
        }}
        onFocus={() => setShowResults(true)}
        className="w-44 rounded-lg border border-desert-tan-dark bg-white/90 px-3 py-1.5 text-sm text-chestnut-dark placeholder:text-olive/70 focus:border-chestnut focus:outline-none focus:ring-2 focus:ring-chestnut/10 dark:border-dark-muted dark:bg-dark-bg dark:text-dark-text dark:placeholder:text-dark-muted"
        aria-label="Search"
      />

      {showResults && query.length >= 2 && (
        <div className="absolute top-full left-0 z-50 mt-1 w-80 rounded-xl border border-desert-tan-dark bg-surface py-2 shadow-lg dark:border-dark-muted dark:bg-dark-surface">
          {loading ? (
            <div className="px-4 py-6 text-center text-sm text-olive dark:text-dark-muted">Searching...</div>
          ) : !hasResults ? (
            <div className="px-4 py-6 text-center text-sm text-olive dark:text-dark-muted">No results found for &quot;{query}&quot;</div>
          ) : (
            <>
              {results!.posts.length > 0 && (
                <div className="px-2">
                  <p className="mb-1 px-2 text-xs font-semibold uppercase text-olive-dark dark:text-dark-muted">Posts</p>
                  {results!.posts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/posts/${post.slug}`}
                      className="block rounded-lg px-3 py-2 text-sm text-chestnut-dark transition hover:bg-surface-hover dark:text-dark-text dark:hover:bg-dark-bg"
                      onClick={() => setShowResults(false)}
                    >
                      {post.title}
                    </Link>
                  ))}
                </div>
              )}
              {results!.albums.length > 0 && (
                <div className="mt-2 border-t border-desert-tan-dark px-2 dark:border-dark-muted">
                  <p className="mb-1 mt-2 px-2 text-xs font-semibold uppercase text-olive-dark dark:text-dark-muted">Albums</p>
                  {results!.albums.map((album) => (
                    <Link
                      key={album.id}
                      href={`/albums/${album.slug}`}
                      className="block rounded-lg px-3 py-2 text-sm text-chestnut-dark transition hover:bg-surface-hover dark:text-dark-text dark:hover:bg-dark-bg"
                      onClick={() => setShowResults(false)}
                    >
                      {album.title}
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
