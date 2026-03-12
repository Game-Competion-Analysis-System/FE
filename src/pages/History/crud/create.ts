import { apiJson } from "@/lib/api";
import type { AnalysisItem } from "../types";

export async function createHistory(body: unknown): Promise<AnalysisItem> {
  return await apiJson<AnalysisItem>("/ai/analyze", { method: "POST", body });
}

