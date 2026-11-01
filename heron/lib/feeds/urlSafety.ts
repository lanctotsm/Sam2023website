/** Public http(s) URLs only — used for feed item links and images in the browser. */
export function sanitizePublicHttpUrl(url: string | null | undefined): string | null {
    if (!url || typeof url !== "string") return null;
    const trimmed = url.trim();
    if (!trimmed) return null;
    try {
        const parsed = new URL(trimmed);
        if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
        return parsed.href;
    } catch {
        return null;
    }
}

function isIpv4Literal(host: string): boolean {
    return /^(?:\d{1,3}\.){3}\d{1,3}$/.test(host);
}

function ipv4ToInt(host: string): number | null {
    const parts = host.split(".").map((p) => Number(p));
    if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
        return null;
    }
    return ((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
}

function isBlockedIpv4(host: string): boolean {
    const n = ipv4ToInt(host);
    if (n === null) return true;
    // Use >>> so comparisons stay in unsigned 32-bit space (JS & is signed).
    const u = n >>> 0;
    // 0.0.0.0/8, 10.0.0.0/8, 127.0.0.0/8, 169.254.0.0/16, 172.16.0.0/12,
    // 192.168.0.0/16, 224.0.0.0/4 (multicast), 240.0.0.0/4 (reserved)
    if (u <= 0x00ffffff) return true;
    if ((u & 0xff000000) >>> 0 === 0x0a000000) return true;
    if ((u & 0xff000000) >>> 0 === 0x7f000000) return true;
    if ((u & 0xffff0000) >>> 0 === 0xa9fe0000) return true;
    if ((u & 0xfff00000) >>> 0 === 0xac100000) return true;
    if ((u & 0xffff0000) >>> 0 === 0xc0a80000) return true;
    if ((u & 0xf0000000) >>> 0 >= 0xe0000000) return true;
    return false;
}

function isBlockedHostname(hostname: string): boolean {
    const host = hostname.toLowerCase().replace(/\.$/, "");
    if (!host) return true;
    if (
        host === "localhost" ||
        host.endsWith(".localhost") ||
        host.endsWith(".local") ||
        host.endsWith(".internal") ||
        host.endsWith(".intranet") ||
        host === "metadata.google.internal"
    ) {
        return true;
    }

    if (host.includes(":")) {
        // IPv6 literals — block loopback, link-local, unique-local, and IPv4-mapped private
        const h = host.replace(/^\[|\]$/g, "");
        if (h === "::1" || h === "::" || h.startsWith("fe80:") || h.startsWith("fc") || h.startsWith("fd")) {
            return true;
        }
        const v4mapped = h.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
        if (v4mapped) return isBlockedIpv4(v4mapped[1]);
        // Other IPv6: treat non-public literals conservatively by blocking all IPv6 IP fetches
        // (feeds almost always use hostnames).
        if (/^[0-9a-f:]+$/i.test(h)) return true;
        return false;
    }

    if (isIpv4Literal(host)) {
        return isBlockedIpv4(host);
    }

    return false;
}

/**
 * Whether a resolved address is a private, loopback, link-local, or otherwise
 * non-public target. Public IPv6 addresses are allowed; typed IPv6 URL hosts
 * stay blocked in `isBlockedHostname`.
 */
export function isBlockedResolvedAddress(address: string): boolean {
    const raw = address.trim().toLowerCase().replace(/^\[|\]$/g, "");
    if (!raw) return true;

    if (!raw.includes(":")) {
        return isBlockedIpv4(raw);
    }

    const v4mappedDotted = raw.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
    if (v4mappedDotted) return isBlockedIpv4(v4mappedDotted[1]);

    const v4mappedHex = raw.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i);
    if (v4mappedHex) {
        const hi = parseInt(v4mappedHex[1], 16);
        const lo = parseInt(v4mappedHex[2], 16);
        const ip = `${(hi >> 8) & 255}.${hi & 255}.${(lo >> 8) & 255}.${lo & 255}`;
        return isBlockedIpv4(ip);
    }

    if (raw === "::1" || raw === "::") return true;
    // fe80::/10 link-local, fc00::/7 unique local, ff00::/8 multicast
    if (/^fe[89a-f]/.test(raw) || raw.startsWith("fc") || raw.startsWith("fd") || raw.startsWith("ff")) {
        return true;
    }
    return false;
}

export type AddressLookup = (hostname: string) => Promise<string[]>;

function isIpLiteralHost(hostname: string): boolean {
    const host = hostname.replace(/^\[|\]$/g, "");
    return isIpv4Literal(host) || host.includes(":");
}

/**
 * A public hostname is safe only when every address it resolves to is public.
 * IP literals are classified by the URL check and are not looked up.
 */
export async function hostResolvesToPublicAddresses(
    url: string,
    lookup: AddressLookup,
    allowHttp = false
): Promise<boolean> {
    if (!isAllowedFeedUrl(url, allowHttp)) return false;
    const hostname = new URL(url).hostname;
    if (isIpLiteralHost(hostname)) return true;

    let addresses: string[];
    try {
        addresses = await lookup(hostname);
    } catch {
        return false;
    }
    if (addresses.length === 0) return false;
    return addresses.every((address) => !isBlockedResolvedAddress(address));
}

/**
 * Whether a URL is safe for the server to fetch as an RSS/Atom source.
 * HTTPS only (HTTP when allowHttp), no credentials, no private/link-local hosts.
 */
export function isAllowedFeedUrl(url: string, allowHttp = false): boolean {
    try {
        const parsed = new URL(url);
        if (parsed.protocol === "https:") {
            // ok
        } else if (allowHttp && parsed.protocol === "http:") {
            // ok
        } else {
            return false;
        }
        if (parsed.username || parsed.password) return false;
        if (isBlockedHostname(parsed.hostname)) return false;
        return true;
    } catch {
        return false;
    }
}
