import { apiJson } from "@/lib/api";

export type Game = {
  gameId: number;
  gameName: string;
  genre: string | null;
  companyName: string | null;
};

// FE only supports these fixed games.
export const ALLOWED_GAME_IDS = new Set<number>([1, 2]);

export function isAllowedGameId(id: number) {
  return ALLOWED_GAME_IDS.has(id);
}

function filterAllowedGames(games: Game[]) {
  return games.filter((g) => isAllowedGameId(g.gameId));
}

let cachedGamesPromise: Promise<Game[]> | null = null;

export function fetchGames(options: { signal?: AbortSignal } = {}): Promise<Game[]> {
  if (!cachedGamesPromise) {
    cachedGamesPromise = apiJson<Game[]>("/Games").then((list) =>
      filterAllowedGames(Array.isArray(list) ? list : []),
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
