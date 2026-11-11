const MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

/**
 * "2021-06" -> "Jun 2021"; "2021-06-15" -> "Jun 2021" (day dropped);
 * "2021" -> "2021". Anything else, including an out-of-range month or day,
 * passes through unchanged.
 */
export function formatPartialDate(value: string): string {
    const match = /^(\d{4})(?:-(0[1-9]|1[0-2])(?:-(0[1-9]|[12]\d|3[01]))?)?$/.exec(value.trim());
    if (!match) return value;
    const year = match[1];
    const month = match[2] ? MONTHS[Number(match[2]) - 1] : undefined;
    return month ? `${month} ${year}` : year;
}

/** Renders a date range; an empty end date reads as "Present". */
export function formatDateRange(startDate: string, endDate: string): string {
    const start = startDate ? formatPartialDate(startDate) : "";
    const end = endDate ? formatPartialDate(endDate) : "Present";
    if (!start) return endDate ? end : "";
    return `${start} – ${end}`;
}
