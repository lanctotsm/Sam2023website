import { createDefaultFrontPageConfig, type FrontPageSettings } from "@/lib/frontPage";

/**
 * Picture of the built-in homepage that shipped before templates.
 * The untouched-site migration compares stored `front_page` to this value.
 *
 * It calls `createDefaultFrontPageConfig()` while that function still returns
 * the pre-template seed. When the default becomes Journal, replace this with a
 * literal copy of today's seed. Do not point it at the new default, or an
 * untouched site will no longer match and the migration will skip it.
 */
export const legacyBuiltInFrontPage: FrontPageSettings = createDefaultFrontPageConfig();
