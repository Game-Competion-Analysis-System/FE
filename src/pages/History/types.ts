export interface LeaderboardEntry {
  rank: number;
  playerName: string;
  score: number;
  guildName: string | null;
}

export interface AnalysisItem {
  analysisId: number;
  imageUrl: string;
  processedTime: string;
  gameName: string | null;
  serverName: string | null;
  eventName: string | null;
  leaderboard: LeaderboardEntry[];
}

