import type { Severity } from "@/consts/severity";

export type Filters = {
  search: string;
  severities: Severity[];
  riskFactors: string[];
  hideManualNoRisk: boolean;
  hideAiNoRisk: boolean;
};

export type SortKey = "severity" | "cvss" | "published";

export type VulnListItem = {
  id: string;
  cve: string;
  severity: Severity;
  cvss: number | null;
  kaiStatus: string | null;

  groupName: string;
  repoName: string;
  imageName: string;
  imageVersion: string;

  packageName: string;
  packageVersion: string;

  published: string;
  fixDate: string;

  link: string;
};

export type DashboardStats = {
  totalCount: number;
  filteredCount: number;

  severityCounts: Array<{ severity: Severity; count: number }>;
  topRiskFactors: Array<{ factor: string; count: number }>;
  trend: Array<{ month: string; count: number }>;

  kaiBuckets: Array<{ bucket: string; count: number }>;
};
