import type { AnalysisItem, LeaderboardEntry } from "./types";

const asNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

const asString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const s = value.trim();
  return s.length ? s : null;
};

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const asNullableString = (value: unknown): string | null => asString(value);

export const extractListPayload = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;
  const obj = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : null;
  if (!obj) return [];
  if (Array.isArray(obj.data)) return obj.data;
  if (Array.isArray(obj.items)) return obj.items;
  if (Array.isArray((obj as any).result)) return (obj as any).result;
  return [];
};

export const normalizeLeaderboardEntry = (input: unknown, idx: number): LeaderboardEntry => {
  const obj = (input && typeof input === "object" ? (input as Record<string, unknown>) : null) ?? {};

  return {
    rank: asNumber(obj.rank ?? (obj as any).Rank ?? (obj as any).ranking ?? idx + 1) ?? idx + 1,
    playerName: asString(obj.playerName ?? (obj as any).playername ?? (obj as any).player ?? (obj as any).name) ?? "",
    score: asNumber(obj.score ?? (obj as any).Score ?? (obj as any).points) ?? 0,
    guildName: asNullableString(obj.guildName ?? (obj as any).guildname ?? (obj as any).guild) ?? null,
  };
};

export const normalizeAnalysisItem = (input: unknown, idx: number): AnalysisItem => {
  const obj = (input && typeof input === "object" ? (input as Record<string, unknown>) : null) ?? {};

  const leaderboardRaw = (obj as any).leaderboard ?? (obj as any).leaderboards;
  const leaderboard = asArray(leaderboardRaw).map((e, i) => normalizeLeaderboardEntry(e, i));

  return {
    analysisId: asNumber(obj.analysisId ?? (obj as any).analysisid ?? (obj as any).id ?? idx) ?? idx,
    imageUrl: asString(obj.imageUrl ?? (obj as any).imageurl ?? (obj as any).image ?? "") ?? "",
    processedTime: asString(obj.processedTime ?? (obj as any).processedtime ?? (obj as any).createdAt ?? "") ?? "",
    gameName: asNullableString(obj.gameName ?? (obj as any).gamename ?? (obj as any).game) ?? null,
    serverName: asNullableString(obj.serverName ?? (obj as any).servername ?? (obj as any).server) ?? null,
    eventName: asNullableString(obj.eventName ?? (obj as any).eventname ?? (obj as any).event) ?? null,
    leaderboard,
  };
};

