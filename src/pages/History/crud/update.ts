import { apiJson } from "@/lib/api";
import type { AnalysisItem } from "../types";

export async function updateHistory(analysisId: number, body: unknown): Promise<AnalysisItem> {
  return await apiJson<AnalysisItem>(`/ai/${analysisId}`, { method: "PUT", body });
}

