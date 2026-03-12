export type AnalysisMeta = {
  gameId: string | null;
  gameName: string | null;
  server: string | null;
  savedAt: string;
};

const STORAGE_KEY = "analysis.meta.v1";
const MAX_ENTRIES = 300;

function safeParseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function loadAll(): Record<string, AnalysisMeta> {
  try {
    return safeParseJson<Record<string, AnalysisMeta>>(localStorage.getItem(STORAGE_KEY)) ?? {};
  } catch {
    return {};
  }
}

function saveAll(next: Record<string, AnalysisMeta>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

function prune(map: Record<string, AnalysisMeta>) {
  const entries = Object.entries(map);
  if (entries.length <= MAX_ENTRIES) return map;

  entries.sort((a, b) => {
    const at = Date.parse(a[1].savedAt);
    const bt = Date.parse(b[1].savedAt);
    return (isNaN(bt) ? 0 : bt) - (isNaN(at) ? 0 : at);
  });

  const keep = entries.slice(0, MAX_ENTRIES);
  return Object.fromEntries(keep);
}

export function saveAnalysisMeta(analysisId: number, meta: Omit<AnalysisMeta, "savedAt">) {
  if (!Number.isFinite(analysisId)) return;
  const id = String(analysisId);
  const current = loadAll();
  current[id] = {
    ...meta,
    savedAt: new Date().toISOString(),
  };
  saveAll(prune(current));
}

export function getAnalysisMeta(analysisId: number): AnalysisMeta | null {
  if (!Number.isFinite(analysisId)) return null;
  const current = loadAll();
  return current[String(analysisId)] ?? null;
}

