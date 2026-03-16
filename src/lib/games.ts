import { apiJson } from "@/lib/api";

export type Game = {
  gameId: number;
  gameName: string;
  genre: string | null;
  companyName: string | null;
};

// Optional env restriction. If not provided, allow all games from the API.
const RAW_ALLOWED_GAME_IDS = (import.meta as any).env?.VITE_ALLOWED_GAME_IDS as string | undefined;
export const ALLOWED_GAME_IDS = new Set<number>(
  RAW_ALLOWED_GAME_IDS
    ? RAW_ALLOWED_GAME_IDS.split(",")
        .map((v) => Number(v.trim()))
        .filter((v) => Number.isFinite(v))
    : [],
);

export function isAllowedGameId(id: number) {
  if (ALLOWED_GAME_IDS.size === 0) return true;
  return ALLOWED_GAME_IDS.has(id);
}

function filterAllowedGames(games: Game[]) {
  if (ALLOWED_GAME_IDS.size === 0) return games;
  return games.filter((g) => isAllowedGameId(g.gameId));
}

let cachedGamesPromise: Promise<Game[]> | null = null;

function toGame(value: unknown): Game | null {
  if (!value || typeof value !== "object") return null;
  const obj = value as Record<string, unknown>;
  const rawId = obj.gameId ?? obj.id ?? obj.gameID ?? obj.game_id;
  const id = typeof rawId === "number" ? rawId : Number(rawId);
  if (!Number.isFinite(id)) return null;

  const rawName = obj.gameName ?? obj.name ?? obj.game ?? obj.gamename;
  const name = typeof rawName === "string" ? rawName.trim() : "";
  if (!name) return null;

  const genre =
    typeof obj.genre === "string" && obj.genre.trim().length > 0 ? obj.genre.trim() : null;
  const companyName =
    typeof obj.companyName === "string" && obj.companyName.trim().length > 0 ? obj.companyName.trim() : null;

  return { gameId: id, gameName: name, genre, companyName };
}

function normalizeGameList(value: unknown): Game[] {
  const raw =
    Array.isArray(value)
      ? value
      : Array.isArray((value as any)?.data)
        ? (value as any).data
        : Array.isArray((value as any)?.result)
          ? (value as any).result
          : Array.isArray((value as any)?.games)
            ? (value as any).games
            : Array.isArray((value as any)?.items)
              ? (value as any).items
            : [];

  return raw.map(toGame).filter((g): g is Game => g !== null);
}

export function fetchGames(options: { signal?: AbortSignal } = {}): Promise<Game[]> {
  if (!cachedGamesPromise) {
    cachedGamesPromise = apiJson<unknown>("/Games").then((payload) =>
      filterAllowedGames(normalizeGameList(payload)),
    );
  }

  if (!options.signal) return cachedGamesPromise;

  return Promise.race([
    cachedGamesPromise,
    new Promise<Game[]>((_, reject) => {
      options.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), {
        once: true,
      });
    }),
  ]);
}

export async function resolveGameName(gameId: string | null | undefined, options: { signal?: AbortSignal } = {}) {
  const raw = gameId?.trim();
  if (!raw) return null;
  const id = Number(raw);
  if (!Number.isFinite(id)) return null;
  if (!isAllowedGameId(id)) return null;

  const games = await fetchGames(options);
  const match = games.find((g) => g.gameId === id);
  return match?.gameName?.trim() ? match.gameName.trim() : null;
}
