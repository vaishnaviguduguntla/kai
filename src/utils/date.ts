export function toMonthBucket(dateTime: string | null | undefined): string | null {
  if (!dateTime) return null;
  const s = dateTime.trim();
  if (s.length < 7) return null;
  return s.slice(0, 7);
}
