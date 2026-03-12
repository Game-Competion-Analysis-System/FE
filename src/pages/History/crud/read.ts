import { apiJson } from "@/lib/api";
import { extractListPayload, normalizeAnalysisItem } from "../normalize";
import type { AnalysisItem } from "../types";

export async function readHistory(): Promise<AnalysisItem[]> {
  const payload = await apiJson<unknown>("/ai", { method: "GET" });
  const list = extractListPayload(payload);
  return list.map(normalizeAnalysisItem);
}

