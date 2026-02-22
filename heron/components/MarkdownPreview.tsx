"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ClientAlbumEmbed from "./ClientAlbumEmbed";

interface MarkdownPreviewProps {
    markdown: string;
}

const SHORTCODE_REGEX = /\[\[(\w+):([\w-]+)\]\]/g;

export default function MarkdownPreview({ markdown }: MarkdownPreviewProps) {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    // Reset regex state
    SHORTCODE_REGEX.lastIndex = 0;

    let keyCounter = 0;

    while ((match = SHORTCODE_REGEX.exec(markdown)) !== null) {
        const textBefore = markdown.slice(lastIndex, match.index);
        if (textBefore.trim()) {
            parts.push(
                <ReactMarkdown key={`md-${keyCounter++}`} remarkPlugins={[remarkGfm]}>
                    {textBefore}
                </ReactMarkdown>
            );
        }

        const type = match[1];
        const identifier = match[2];

        if (type === "album") {
            parts.push(
                <div key={`shortcode-${keyCounter++}`}>
                    <ClientAlbumEmbed slug={identifier} />
                </div>
            );
        } else {
            // Unknown shortcode, render as text
            parts.push(
                <p key={`unknown-${keyCounter++}`} className="text-copper">
                    [Unknown shortcode: {match[0]}]
                </p>
            );
        }

        lastIndex = match.index + match[0].length;
    }

    const textAfter = markdown.slice(lastIndex);
    if (textAfter.trim()) {
        parts.push(
            <ReactMarkdown key={`md-${keyCounter++}`} remarkPlugins={[remarkGfm]}>
                {textAfter}
            </ReactMarkdown>
        );
    }

    if (parts.length === 0 && markdown) {
        // If there was only whitespace or non-matched text, we still want to render it
        return <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>;
    }

    return <div className="prose prose-sm max-w-none prose-headings:text-chestnut prose-p:text-chestnut-dark dark:prose-headings:text-dark-text dark:prose-p:text-dark-muted">{parts}</div>;
}
