const EMAIL_ADDRESS = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{1,}/i;

/** True when a string contains an email address. */
export function containsEmailAddress(value: string): boolean {
    return EMAIL_ADDRESS.test(value);
}

/** Removes email addresses from visitor-facing copy. */
export function redactEmails(value: string): string {
    return value
        .replace(new RegExp(EMAIL_ADDRESS.source, "gi"), "")
        .replace(/[ \t]{2,}/g, " ")
        .replace(/\s+([,.;:!?])/g, "$1")
        .trim();
}

/** Mailto links and any label or URL that contains an address. */
export function linkExposesEmail(link: { label: string; url: string }): boolean {
    const url = link.url.trim();
    return /^mailto:/i.test(url) || containsEmailAddress(url) || containsEmailAddress(link.label);
}
