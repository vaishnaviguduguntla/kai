import { SEVERITIES, type Severity } from "@/consts/severity";

export function normalizeSeverity(input: string | null | undefined): Severity {
  const s = (input ?? "").toLowerCase().trim();
  return (SEVERITIES as readonly string[]).includes(s) ? (s as Severity) : "unknown";
}
