import type { DashboardStats, Filters, SortKey, VulnListItem } from "@/types/models";

export type VulnListParams = {
  filters: Filters;
  sortKey: SortKey;
  page: number;
  pageSize: number;
};

export type VulnListResult = {
  rows: VulnListItem[];
  totalFiltered: number;
};

export interface DataService {
  getDashboardStats(filters: Filters): Promise<DashboardStats>;
  getVulnerabilities(params: VulnListParams): Promise<VulnListResult>;
  getVulnerabilitiesByIds(ids: string[]): Promise<VulnListItem[]>;
  getSuggestions(prefix: string): Promise<Array<{ label: string; type: "cve" | "package" }>>;
}
