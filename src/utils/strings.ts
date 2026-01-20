export function clampText(s: string, max = 160) {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}
