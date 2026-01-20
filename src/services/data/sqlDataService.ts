import type { DashboardStats, Filters, SortKey, VulnListItem } from "@/types/models";
import { KAI_STATUS } from "@/consts/kaiStatus";
import { query } from "@/services/sql/sqlClient";
import type { DataService, VulnListParams, VulnListResult } from "./dataService";

function buildWhere(filters: Filters) {
  const clauses: string[] = ["1=1"];
  const params: Record<string, any> = {};

  const q = (filters.search ?? "").trim();
  if (q) {
    clauses.push(`(
      cve LIKE $q OR
      packageName LIKE $q OR
      repoName LIKE $q OR
      imageName LIKE $q
    )`);
    params.$q = `%${q}%`;
  }

  if (filters.severities?.length) {
    const keys = filters.severities.map((_, i) => `$sev${i}`);
    clauses.push(`severity IN (${keys.join(",")})`);
    filters.severities.forEach((sev, i) => (params[`$sev${i}`] = sev));
  }

  // Apply "Analysis" and "AI Analysis" toggles
  if (filters.hideManualNoRisk) {
    clauses.push("(kaiStatus IS NULL OR kaiStatus != $manualNoRisk)");
    params.$manualNoRisk = KAI_STATUS.MANUAL_INVALID_NORISK;
  }
  if (filters.hideAiNoRisk) {
    clauses.push("(kaiStatus IS NULL OR kaiStatus != $aiNoRisk)");
    params.$aiNoRisk = KAI_STATUS.AI_INVALID_NORISK;
  }

  // Risk factor filtering: require vuln to have ALL selected factors
  if (filters.riskFactors?.length) {
    // Join table exists as vuln_risk_factors
    // For ALL factors: count matching factors = number of selected
    const keys = filters.riskFactors.map((_, i) => `$rf${i}`);
    clauses.push(`id IN (
      SELECT vulnId
      FROM vuln_risk_factors
      WHERE factor IN (${keys.join(",")})
      GROUP BY vulnId
      HAVING COUNT(DISTINCT factor) = ${filters.riskFactors.length}
    )`);
    filters.riskFactors.forEach((f, i) => (params[`$rf${i}`] = f));
  }

  return { where: clauses.join(" AND "), params };
}

function buildSort(sortKey: SortKey) {
  if (sortKey === "cvss") return "cvss DESC";
  if (sortKey === "severity") {
    return `CASE severity
      WHEN 'critical' THEN 4
      WHEN 'high' THEN 3
      WHEN 'medium' THEN 2
      WHEN 'low' THEN 1
      ELSE 0
    END DESC`;
  }
  return "published DESC";
}

export const sqlDataService: DataService = {
  async getVulnerabilities(params: VulnListParams): Promise<VulnListResult> {
    const { filters, sortKey, page, pageSize } = params;
    const { where, params: bind } = buildWhere(filters);
    const sort = buildSort(sortKey);
    const offset = page * pageSize;

    const rows = await query(
      `
      SELECT
        id,
        cve,
        severity,
        cvss,
        kaiStatus,
        groupName,
        repoName,
        imageName,
        imageVersion,
        packageName,
        packageVersion,
        published,
        fixDate,
        status,
        link
      FROM vulnerabilities
      WHERE ${where}
      ORDER BY ${sort}, cve ASC
      LIMIT $limit OFFSET $offset
      `,
      { ...bind, $limit: pageSize, $offset: offset }
    );

    const total = await query(
      `SELECT COUNT(*) as totalFiltered FROM vulnerabilities WHERE ${where}`,
      bind
    );

    return {
      rows: rows as VulnListItem[],
      totalFiltered: Number((total?.[0] as any)?.totalFiltered ?? 0)
    };
  },

  async getVulnerabilitiesByIds(ids: string[]): Promise<VulnListItem[]> {
    if (!ids.length) return [];
    const keys = ids.map((_, i) => `$id${i}`);
    const bind: Record<string, any> = {};
    ids.forEach((id, i) => (bind[`$id${i}`] = id));

    const rows = await query(
      `
      SELECT
        id,
        cve,
        severity,
        cvss,
        kaiStatus,
        groupName,
        repoName,
        imageName,
        imageVersion,
        packageName,
        packageVersion,
        published,
        fixDate,
        status,
        description,
        link
      FROM vulnerabilities
      WHERE id IN (${keys.join(",")})
      `,
      bind
    );

    // keep same order as selectedIds
    const byId = new Map((rows as any[]).map((r) => [r.id, r]));
    return ids.map((id) => byId.get(id)).filter(Boolean) as VulnListItem[];
  },

  async getSuggestions(prefix: string) {
    const p = prefix.trim();
    if (!p) return [];
    const like = `%${p}%`;

    const cves = await query(
      `SELECT cve as label FROM vulnerabilities WHERE cve LIKE $q GROUP BY cve ORDER BY cve ASC LIMIT 8`,
      { $q: like }
    );
    const pkgs = await query(
      `SELECT packageName as label FROM vulnerabilities WHERE packageName LIKE $q GROUP BY packageName ORDER BY packageName ASC LIMIT 8`,
      { $q: like }
    );

    return [
      ...cves.map((r: any) => ({ label: r.label, type: "cve" as const })),
      ...pkgs.map((r: any) => ({ label: r.label, type: "package" as const }))
    ].slice(0, 10);
  },

  async getDashboardStats(filters: Filters): Promise<DashboardStats> {
    const { where, params: bind } = buildWhere(filters);

    // KPI totals
    const [{ total: totalCount }] = (await query(`SELECT COUNT(*) as total FROM vulnerabilities`)) as any[];
    const [{ filtered: filteredCount }] = (await query(
      `SELECT COUNT(*) as filtered FROM vulnerabilities WHERE ${where}`,
      bind
    )) as any[];

    // Severity distribution
    const severityCounts = (await query(
      `
      SELECT severity, COUNT(*) as count
      FROM vulnerabilities
      WHERE ${where}
      GROUP BY severity
      ORDER BY count DESC
      `,
      bind
    )) as any[];

    // Risk factors frequency (top 10)
    const topRiskFactors = (await query(
      `
      SELECT rf.factor as factor, COUNT(*) as count
      FROM vuln_risk_factors rf
      JOIN vulnerabilities v ON v.id = rf.vulnId
      WHERE ${where}
      GROUP BY rf.factor
      ORDER BY count DESC
      LIMIT 10
      `,
      bind
    )) as any[];

    // Trend (by month)
    const trend = (await query(
      `
      SELECT substr(published, 1, 7) as month, COUNT(*) as count
      FROM vulnerabilities
      WHERE ${where} AND published IS NOT NULL AND published != ''
      GROUP BY month
      ORDER BY month ASC
      `,
      bind
    )) as any[];

    // AI vs Manual buckets
    const kaiBuckets = (await query(
      `
      SELECT
        CASE
          WHEN kaiStatus = $manual THEN 'manual_norisk'
          WHEN kaiStatus = $ai THEN 'ai_norisk'
          WHEN kaiStatus IS NULL OR kaiStatus = '' THEN 'unclassified'
          ELSE 'other'
        END as bucket,
        COUNT(*) as count
      FROM vulnerabilities
      WHERE ${where}
      GROUP BY bucket
      ORDER BY count DESC
      `,
      { ...bind, $manual: KAI_STATUS.MANUAL_INVALID_NORISK, $ai: KAI_STATUS.AI_INVALID_NORISK }
    )) as any[];

    return {
      totalCount: Number(totalCount ?? 0),
      filteredCount: Number(filteredCount ?? 0),
      severityCounts: severityCounts.map((r) => ({ severity: r.severity, count: Number(r.count) })),
      topRiskFactors: topRiskFactors.map((r) => ({ factor: r.factor, count: Number(r.count) })),
      trend: trend.map((r) => ({ month: r.month, count: Number(r.count) })),
      kaiBuckets: kaiBuckets.map((r) => ({ bucket: r.bucket, count: Number(r.count) }))
    } as DashboardStats;
  }
};
