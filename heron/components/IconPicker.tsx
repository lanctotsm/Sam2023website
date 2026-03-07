"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { icons } from "lucide-react";
import LucideIcon from "@/components/LucideIcon";

const allIconNames = Object.keys(icons).sort();

type IconPickerProps = {
    value: string;
    onChange: (name: string) => void;
};

export default function IconPicker({ value, onChange }: IconPickerProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    const filtered = useMemo(() => {
        if (!search.trim()) return allIconNames.slice(0, 80);
        const q = search.toLowerCase();
        return allIconNames.filter((n) => n.toLowerCase().includes(q)).slice(0, 80);
    }, [search]);

    // Close on click outside
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    return (
        <div ref={containerRef} className="relative inline-block">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-2 rounded-lg border border-desert-tan-dark bg-surface px-3 py-2 text-sm transition-colors hover:bg-desert-tan/10 dark:border-dark-muted dark:bg-dark-surface dark:hover:bg-dark-bg"
            >
                {value ? <LucideIcon name={value} size={18} /> : <span className="text-olive dark:text-dark-muted">Pick icon</span>}
                <span className="text-xs text-olive dark:text-dark-muted">{value || "none"}</span>
            </button>

            {open && (
                <div className="absolute left-0 top-full z-50 mt-1 w-[320px] rounded-xl border border-desert-tan-dark bg-surface p-3 shadow-lg dark:border-dark-muted dark:bg-dark-surface">
                    <input
                        type="text"
                        placeholder="Search icons…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="mb-2 w-full rounded-lg border border-desert-tan-dark bg-white px-3 py-1.5 text-sm outline-none focus:border-chestnut dark:border-dark-muted dark:bg-dark-bg dark:text-dark-text dark:focus:border-caramel"
                        autoFocus
                    />
                    <div className="grid max-h-[240px] grid-cols-6 gap-1 overflow-y-auto">
                        {filtered.map((name) => (
                            <button
                                key={name}
                                type="button"
                                onClick={() => {
                                    onChange(name);
                                    setOpen(false);
                                    setSearch("");
                                }}
                                title={name}
                                className={`flex items-center justify-center rounded-lg p-2 text-chestnut-dark transition-colors hover:bg-chestnut/10 dark:text-dark-text dark:hover:bg-dark-muted/20 ${value === name ? "bg-chestnut/15 ring-1 ring-chestnut dark:bg-dark-muted/30 dark:ring-caramel" : ""
                                    }`}
                            >
                                <LucideIcon name={name} size={20} />
                            </button>
                        ))}
                        {filtered.length === 0 && (
                            <p className="col-span-6 py-4 text-center text-sm text-olive dark:text-dark-muted">No icons found</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
