import { apiJson } from "@/lib/api";

export async function deleteHistory(analysisId: number): Promise<void> {
  await apiJson<unknown>(`/ai/${analysisId}`, { method: "DELETE" });
}

