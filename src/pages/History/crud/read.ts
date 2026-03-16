import { apiJson } from "@/lib/api";
import { extractListPayload, normalizeAnalysisItem } from "../normalize";
import type { AnalysisItem } from "../types";

export type ReadHistoryParams = {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  sortBy?: string;
  isDescending?: boolean;
  filter?: string;
  startDate?: string;
  endDate?: string;
  gameName?: string;
};

export type ReadHistoryResult = {
  items: AnalysisItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
};

const asNumber = (value: unknown, fallback: number) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
};

const asBoolean = (value: unknown, fallback: boolean) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return fallback;
};

export async function readHistory(params: ReadHistoryParams = {}): Promise<ReadHistoryResult> {
  const search = new URLSearchParams();
  if (params.pageNumber) search.set("PageNumber", String(params.pageNumber));
  if (params.pageSize) search.set("PageSize", String(params.pageSize));
  if (params.searchTerm) search.set("SearchTerm", params.searchTerm);
  if (params.sortBy) search.set("SortBy", params.sortBy);
  if (params.isDescending != null) search.set("IsDescending", String(params.isDescending));
  if (params.filter) search.set("Filter", params.filter);
  if (params.startDate) search.set("StartDate", params.startDate);
  if (params.endDate) search.set("EndDate", params.endDate);
  if (params.gameName) search.set("GameName", params.gameName);

  const query = search.toString();
  const payload = await apiJson<unknown>(query ? `/ai?${query}` : "/ai", { method: "GET" });
  const list = extractListPayload(payload);

  const obj = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : null;
  const totalCount = asNumber(obj?.totalCount, list.length);
  const pageNumber = asNumber(obj?.pageNumber, params.pageNumber ?? 1);
  const pageSize = asNumber(obj?.pageSize, params.pageSize ?? list.length);
  const totalPages = asNumber(obj?.totalPages, Math.max(1, Math.ceil(totalCount / Math.max(1, pageSize))));
  const hasPrevious = asBoolean(obj?.hasPrevious, pageNumber > 1);
  const hasNext = asBoolean(obj?.hasNext, pageNumber < totalPages);

  return {
    items: list.map(normalizeAnalysisItem),
    totalCount,
    pageNumber,
    pageSize,
    totalPages,
    hasPrevious,
    hasNext,
  };
}

