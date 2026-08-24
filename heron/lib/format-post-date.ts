export function formatPostDate(
  dateStr: string | null | undefined,
  month: "short" | "long" = "short"
): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month,
    day: "numeric"
  });
}
