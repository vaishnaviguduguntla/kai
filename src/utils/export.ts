import Papa from "papaparse";
import { saveAs } from "file-saver";
import type { VulnListItem } from "@/types/models";

export function exportToCsv(rows: VulnListItem[], filename = "vulnerabilities.csv") {
  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  saveAs(blob, filename);
}
