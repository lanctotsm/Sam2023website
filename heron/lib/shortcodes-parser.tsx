import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const SHORTCODE_REGEX = /\[\[(\w+):([\w-]+)\]\]/g;

/**
 * Parses a markdown string containing [[type:identifier]] shortcodes and
 * returns an array of React nodes. Each shortcode is replaced by the result
 * of calling `renderShortcode(type, identifier, key)`. The caller is
 * responsible for rendering the shortcode appropriately (server vs. client).
 */
export function parseShortcodes(
    markdown: string,
    renderShortcode: (type: string, identifier: string, key: string) => React.ReactNode
): React.ReactNode[] {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let keyCounter = 0;

    // Reset regex state (regex is module-level, must reset before each use)
    SHORTCODE_REGEX.lastIndex = 0;

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
        parts.push(renderShortcode(type, identifier, `shortcode-${keyCounter++}`));

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

    return parts;
}
