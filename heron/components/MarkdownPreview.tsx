"use client";

import React from "react";
import { parseShortcodes } from "@/lib/shortcodes";
import ClientAlbumEmbed from "./ClientAlbumEmbed";

interface MarkdownPreviewProps {
    markdown: string;
}

export default function MarkdownPreview({ markdown }: MarkdownPreviewProps) {
    const parts = parseShortcodes(markdown, (type, identifier, key) => {
        if (type === "album") {
            return (
                <div key={key}>
                    <ClientAlbumEmbed slug={identifier} />
                </div>
            );
        }
        return (
            <p key={key} className="text-copper">
                [Unknown shortcode: [[{type}:{identifier}]]]
            </p>
        );
    });

    return (
        <div className="prose prose-sm max-w-none prose-headings:text-chestnut prose-p:text-chestnut-dark dark:prose-headings:text-dark-text dark:prose-p:text-dark-muted">
            {parts}
        </div>
    );
}
