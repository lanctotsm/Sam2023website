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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    <div className="search-bar" ref={containerRef}>
      <input
        type="search"
        placeholder="Search..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowResults(true);
        }}
        onFocus={() => setShowResults(true)}
        className="search-bar__input"
        aria-label="Search content"
      />

      {showResults && (query.length >= 2) && (
        <div className="search-bar__results">
          {loading ? (
            <div className="search-bar__status">Searching...</div>
          ) : !hasResults ? (
            <div className="search-bar__status">No results found for &quot;{query}&quot;</div>
          ) : (
            <>
              {results.posts.length > 0 && (
                <div className="search-bar__group">
                  <h3 className="search-bar__group-title">Posts</h3>
                  {results.posts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/posts/${post.slug}`}
                      className="search-bar__item"
                      onClick={() => setShowResults(false)}
                    >
                      {post.title}
                    </Link>
                  ))}
                </div>
              )}
              {results.albums.length > 0 && (
                <div className="search-bar__group">
                  <h3 className="search-bar__group-title">Albums</h3>
                  {results.albums.map((album) => (
                    <Link
                      key={album.id}
                      href={`/albums/${album.slug}`}
                      className="search-bar__item"
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
