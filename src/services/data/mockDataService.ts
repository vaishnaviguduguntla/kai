import type { DataService, VulnListParams, VulnListResult } from "./dataService";
import type { DashboardStats, Filters, VulnListItem } from "@/types/models";
import { normalizeSeverity } from "@/utils/severity";
import { toMonthBucket } from "@/utils/date";
import { KAI_STATUS } from "@/consts/kaiStatus";

// A small in-memory sample. Replace with SQL worker implementation later.
const rows: VulnListItem[] = [
  {
    id: "quay.neelamcorp.priv/1356-ci-cd/app_gonzfixi:1.0.5::CVE-2015-1283::python::2.7.5",
    cve: "CVE-2015-1283",
    severity: normalizeSeverity("high"),
    cvss: 6.8,
    kaiStatus: KAI_STATUS.AI_INVALID_NORISK,
    groupName: "1356-ci-cd",
    repoName: "app_gonzfixi",
    imageName: "quay.neelamcorp.priv/1356-ci-cd/app_gonzfixi:1.0.5",
    imageVersion: "1.0.5",
    packageName: "python",
    packageVersion: "2.7.5",
    published: "2015-07-23 00:59:12",
    fixDate: "2015-07-23 00:59:00",
    link: "https://nvd.nist.gov/vuln/detail/CVE-2015-1283"
  },
  {
    id: "quay.neelamcorp.priv/1356-ci-cd/app_gonzfixi:1.0.5::CVE-2024-22262::spring-web::5.1.8.RELEASE",
    cve: "CVE-2024-22262",
    severity: normalizeSeverity("high"),
    cvss: 8.1,
    kaiStatus: null,
    groupName: "1356-ci-cd",
    repoName: "app_gonzfixi",
    imageName: "quay.neelamcorp.priv/1356-ci-cd/app_gonzfixi:1.0.5",
    imageVersion: "1.0.5",
    packageName: "spring-web",
    packageVersion: "5.1.8.RELEASE",
    published: "2024-04-16 06:30:28",
    fixDate: "2024-04-30 23:31:20",
    link: "https://nvd.nist.gov/vuln/detail/CVE-2024-22262"
  }
];

function passesKaiFilters(r: VulnListItem, f: Filters) {
  if (f.hideAiNoRisk && r.kaiStatus === KAI_STATUS.AI_INVALID_NORISK) return false;
  if (f.hideManualNoRisk && r.kaiStatus === KAI_STATUS.MANUAL_INVALID_NORISK) return false;
  return true;
}

function passesSearch(r: VulnListItem, q: string) {
  if (!q) return true;
  const s = q.trim().toLowerCase();
  return (
    r.cve.toLowerCase().includes(s) ||
    r.packageName.toLowerCase().includes(s) ||
    r.repoName.toLowerCase().includes(s) ||
    r.imageName.toLowerCase().includes(s)
  );
}

function passesSeverity(r: VulnListItem, severities: Filters["severities"]) {
  if (!severities.length) return true;
  return severities.includes(r.severity);
}

export const mockDataService: DataService = {
  async getDashboardStats(filters: Filters): Promise<DashboardStats> {
    const totalCount = rows.length;
    const filtered = rows.filter((r) => passesKaiFilters(r, filters) && passesSearch(r, filters.search) && passesSeverity(r, filters.severities));
    const filteredCount = filtered.length;

    const severityCountsMap = new Map<string, number>();
    for (const r of filtered) severityCountsMap.set(r.severity, (severityCountsMap.get(r.severity) ?? 0) + 1);
    const severityCounts = Array.from(severityCountsMap.entries()).map(([severity, count]) => ({ severity: severity as any, count }));

    const trendMap = new Map<string, number>();
    for (const r of filtered) {
      const m = toMonthBucket(r.published);
      if (!m) continue;
      trendMap.set(m, (trendMap.get(m) ?? 0) + 1);
    }
    const trend = Array.from(trendMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => ({ month, count }));

    // Risk factors are not in the list rows sample; provide static placeholders
    const topRiskFactors = [
      { factor: "Attack vector: network", count: filteredCount },
      { factor: "Has fix", count: Math.max(0, filteredCount - 1) }
    ];

    const kaiBuckets = [
      { bucket: "AI: invalid - norisk", count: filtered.filter((r) => r.kaiStatus === KAI_STATUS.AI_INVALID_NORISK).length },
      { bucket: "Manual: invalid - norisk", count: filtered.filter((r) => r.kaiStatus === KAI_STATUS.MANUAL_INVALID_NORISK).length },
      { bucket: "Other / Not tagged", count: filtered.filter((r) => !r.kaiStatus || (r.kaiStatus !== KAI_STATUS.AI_INVALID_NORISK && r.kaiStatus !== KAI_STATUS.MANUAL_INVALID_NORISK)).length }
    ];

    return { totalCount, filteredCount, severityCounts, topRiskFactors, trend, kaiBuckets };
  },

  async getVulnerabilities(params: VulnListParams): Promise<VulnListResult> {
    const { filters, sortKey, page, pageSize } = params;
    const filtered = rows
      .filter((r) => passesKaiFilters(r, filters) && passesSearch(r, filters.search) && passesSeverity(r, filters.severities));

    const sorted = [...filtered].sort((a, b) => {
      if (sortKey === "cvss") return (b.cvss ?? -1) - (a.cvss ?? -1);
      if (sortKey === "published") return b.published.localeCompare(a.published);
      // severity
      return b.severity.localeCompare(a.severity);
    });

    const start = page * pageSize;
    const paged = sorted.slice(start, start + pageSize);

    return { rows: paged, totalFiltered: filtered.length };
  },

  async getVulnerabilitiesByIds(ids: string[]): Promise<VulnListItem[]> {
    if (!ids.length) return [];
    const set = new Set(ids);
    // Preserve the selection order as much as possible
    const byId = new Map(rows.map((r) => [r.id, r] as const));
    return ids.map((id) => byId.get(id)).filter((r): r is VulnListItem => Boolean(r && set.has(r.id)));
  },

  async getSuggestions(prefix: string) {
    const p = prefix.trim().toUpperCase();
    if (!p) return [];
    const cves = Array.from(new Set(rows.map((r) => r.cve))).filter((c) => c.startsWith(p)).slice(0, 5);
    const pkgs = Array.from(new Set(rows.map((r) => r.packageName))).filter((x) => x.toUpperCase().startsWith(p)).slice(0, 5);
    return [...cves.map((label) => ({ label, type: "cve" as const })), ...pkgs.map((label) => ({ label, type: "package" as const }))].slice(0, 8);
  }
};
