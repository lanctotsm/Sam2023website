"use client";

import React from "react";
import { parseShortcodes } from "@/lib/shortcodes-parser";
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
        <div className="markdown-body text-[0.95rem] text-chestnut-dark dark:text-dark-text">
            {parts}
        </div>
    );
}
