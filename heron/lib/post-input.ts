export type PostWriteData = {
  title: string;
  slug: string;
  summary: string;
  markdown: string;
  status: "draft" | "published" | "archived";
  publishedAt: string | null;
  metadata: Record<string, string> | null;
  /** Omitted on update means keep the existing image relationships. */
  inlineImageIds?: number[];
};

type PostInputResult = { ok: true; data: PostWriteData } | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Require an explicit timezone so schedules never depend on the server's locale. */
function normalizePublicationDate(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day, hour, minute, second = "0"] = match;
  const calendarDay = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
  if (
    !Number.isFinite(calendarDay.getTime()) ||
    calendarDay.toISOString().slice(0, 10) !== `${year}-${month}-${day}` ||
    Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59
  ) return null;

  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

export function parsePostInput(payload: unknown): PostInputResult {
  const invalid = (error: string): PostInputResult => ({ ok: false, error });
  if (!isRecord(payload)) return invalid("post must be a JSON object");

  const { title, slug, markdown, summary, status, published_at, metadata, inline_image_ids } = payload;
  if (
    typeof title !== "string" || !title.trim() ||
    typeof slug !== "string" || !slug.trim() ||
    typeof markdown !== "string" || !markdown.trim()
  ) return invalid("title, slug, and markdown must be non-empty strings");

  if (!/^[a-zA-Z0-9_-]+$/.test(slug.trim())) {
    return invalid("slug may only contain letters, numbers, hyphens, and underscores");
  }
  if (summary !== undefined && summary !== null && typeof summary !== "string") {
    return invalid("summary must be a string");
  }

  const normalizedStatus = status == null ? "draft" : typeof status === "string" ? status.trim().toLowerCase() || "draft" : null;
  if (normalizedStatus !== "draft" && normalizedStatus !== "published" && normalizedStatus !== "archived") {
    return invalid("status must be draft, published, or archived");
  }

  let publishedAt: string | null = null;
  if (published_at !== undefined && published_at !== null && published_at !== "") {
    if (typeof published_at !== "string") return invalid("published_at must be a timestamp or null");
    publishedAt = normalizePublicationDate(published_at);
    if (!publishedAt) return invalid("published_at must be a valid ISO timestamp with a timezone");
  }

  if (metadata !== undefined && metadata !== null && (
    !isRecord(metadata) || Object.values(metadata).some((value) => typeof value !== "string")
  )) return invalid("metadata must be an object with string values");

  let inlineImageIds: number[] | undefined;
  if (inline_image_ids !== undefined) {
    if (!Array.isArray(inline_image_ids) || inline_image_ids.some((id) => !Number.isSafeInteger(id) || id <= 0)) {
      return invalid("inline_image_ids must be an array of positive integer IDs");
    }
    inlineImageIds = [...new Set(inline_image_ids as number[])];
  }

  return {
    ok: true,
    data: {
      title: title.trim(),
      slug: slug.trim(),
      markdown: markdown.trim(),
      summary: typeof summary === "string" ? summary.trim() : "",
      status: normalizedStatus,
      publishedAt,
      metadata: metadata == null ? null : metadata as Record<string, string>,
      inlineImageIds
    }
  };
}

export async function readPostInput(request: Request): Promise<PostInputResult> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return { ok: false, error: "request body must be valid JSON" };
  }
  return parsePostInput(payload);
}

export function postSaveError(error: unknown): { message: string; status: number } {
  if (isRecord(error) && error.code === "SQLITE_CONSTRAINT_UNIQUE" && String(error.message).includes("posts.slug")) {
    return { message: "a post with that slug already exists", status: 409 };
  }
  if (isRecord(error) && error.code === "SQLITE_CONSTRAINT_FOREIGNKEY") {
    return { message: "one or more referenced records no longer exist", status: 400 };
  }
  return { message: "failed to save post", status: 500 };
}
