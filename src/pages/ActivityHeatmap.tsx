import { useEffect, useState } from "react";
import { Calendar, TrendingUp, ArrowLeft, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiJson } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const TIME_SLOTS = [
  "00-04h",
  "04-08h",
  "08-12h",
  "12-16h",
  "16-20h",
  "20-24h",
];

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const DAY_NUMBERS = [1, 2, 3, 4, 5, 6, 0]; // 0 = Sunday

interface AnalysisItem {
  analysisId?: number;
  processedTime?: string;
  gameName?: string | null;
  serverName?: string | null;
  leaderboard?: Array<any>;
}

interface ActivityData {
  timestamp: string;
  forceIncrease: number;
  gain?: number;      // +: increase, -: decrease
}

interface HeatmapCell {
  timeSlot: string;
  day: string;
  dayNum: number;
  timeStart: number;
  value: number;
  count: number;
  avgGain?: number;   // avg gain/loss for this cell
}

const parseApiDate = (raw: string): Date | null => {
  const s = (raw ?? "").trim();
  if (!s) return null;

  // If backend returns an ISO string without timezone (e.g 2026-03-13T01:49:00),
  // assume it's UTC and append "Z" so the UI shows correct local time.
  const looksIsoWithoutZone =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?$/.test(s) &&
    !/[zZ]$/.test(s) &&
    !/[+-]\d{2}:\d{2}$/.test(s);

  const isoUtc = looksIsoWithoutZone ? `${s}Z` : s;
  const d = new Date(isoUtc);
  if (isNaN(d.getTime())) return null;
  return d;
};

const normalizeHistoryItems = (payload: unknown): AnalysisItem[] => {
  if (Array.isArray(payload)) {
    return payload.map((item: any) => ({
      analysisId: typeof item.analysisId === "number" ? item.analysisId : undefined,
      processedTime: typeof item.processedTime === "string" ? item.processedTime : undefined,
      gameName: typeof item.gameName === "string" ? item.gameName : null,
      serverName: typeof item.serverName === "string" ? item.serverName : null,
      leaderboard: Array.isArray(item.leaderboard) ? item.leaderboard : [],
    }));
  }

  const obj = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const itemsRaw = Array.isArray((obj as any).items) ? (obj as any).items : [];
  return itemsRaw.map((item: any) => ({
    analysisId: typeof item.analysisId === "number" ? item.analysisId : undefined,
    processedTime: typeof item.processedTime === "string" ? item.processedTime : undefined,
    gameName: typeof item.gameName === "string" ? item.gameName : null,
    serverName: typeof item.serverName === "string" ? item.serverName : null,
    leaderboard: Array.isArray(item.leaderboard) ? item.leaderboard : [],
  }));
};

const calculateActivityFromHistory = (items: AnalysisItem[], playerName?: string): ActivityData[] => {
  const activities: ActivityData[] = [];

  items.forEach((item) => {
    if (!item.processedTime) return;
    
    const date = parseApiDate(item.processedTime);
    if (!date) return;

    // Lọc score của player được chọn
    let playerScore = 0;
    let found = false;
    
    if (playerName) {
      // Tìm entry của player trong leaderboard
      const playerEntry = (item.leaderboard ?? []).find((entry: any) => {
        const entryName = typeof entry.playerName === "string" ? entry.playerName : "";
        return entryName.toLowerCase() === playerName.toLowerCase();
      });
      if (playerEntry) {
        playerScore = typeof playerEntry.score === "number" ? playerEntry.score : 0;
        found = true;
      }
    } else {
      // Nếu không chọn player cụ thể, tính tổng score
      playerScore = (item.leaderboard ?? []).reduce((sum: number, entry: any) => {
        const score = typeof entry.score === "number" ? entry.score : 0;
        return sum + score;
      }, 0);
      found = (item.leaderboard ?? []).length > 0;
    }

    if (found && playerScore >= 0) {
      activities.push({
        timestamp: date.toISOString(),
        forceIncrease: playerScore,
      });
    }
  });

  // Sort by timestamp để tính gain
  activities.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Tính gain (so sánh với entry trước đó)
  for (let i = 1; i < activities.length; i++) {
    activities[i].gain = activities[i].forceIncrease - activities[i - 1].forceIncrease;
  }

  return activities;
};

const getTimeSlotIndex = (hour: number): number => {
  if (hour < 4) return 0;
  if (hour < 8) return 1;
  if (hour < 12) return 2;
  if (hour < 16) return 3;
  if (hour < 20) return 4;
  return 5;
};

const groupActivityByTimeAndDay = (activities: ActivityData[]): Map<string, { value: number; count: number; avgGain: number }> => {
  const grouped = new Map<string, { value: number; count: number; gains: number[] }>();

  activities.forEach((activity) => {
    try {
      const date = new Date(activity.timestamp);
      const hour = date.getHours();
      const dayNum = date.getDay();

      const timeSlotIdx = getTimeSlotIndex(hour);
      const key = `${timeSlotIdx}-${dayNum}`;

      const existing = grouped.get(key) || { value: 0, count: 0, gains: [] };
      existing.value += activity.forceIncrease;
      existing.count += 1;
      if (activity.gain !== undefined) {
        existing.gains.push(activity.gain);
      }
      grouped.set(key, existing);
    } catch (e) {
      console.error("Invalid timestamp:", activity.timestamp);
    }
  });

  // Convert to final format with avgGain
  const result = new Map<string, { value: number; count: number; avgGain: number }>();
  grouped.forEach((data, key) => {
    const avgGain = data.gains.length > 0 
      ? data.gains.reduce((sum, g) => sum + g, 0) / data.gains.length 
      : 0;
    result.set(key, {
      value: data.value,
      count: data.count,
      avgGain
    });
  });

  return result;
};

interface ColorStyle {
  backgroundColor: string;
  borderColor: string;
}

const getColor = (value: number, maxValue: number, minValue: number, avgGain?: number): ColorStyle => {
  if (maxValue === minValue) {
    return {
      backgroundColor: "rgba(59, 130, 246, 0.3)",
      borderColor: "rgba(59, 130, 246, 0.5)"
    };
  }

  const ratio = (value - minValue) / (maxValue - minValue);
  const opacity = 0.2 + (ratio * 0.8);
  
  // Nếu có biến động gain, dùng nó để quyết định màu sắc
  if (avgGain !== undefined) {
    if (avgGain < 0) {
      // Giảm → Đỏ cảnh báo
      const r = 239, g = 68, b = 68;
      return {
        backgroundColor: `rgba(${r}, ${g}, ${b}, ${opacity})`,
        borderColor: `rgba(${r}, ${g}, ${b}, ${Math.min(1, opacity + 0.1)})`
      };
    } else if (avgGain > 0) {
      // Tăng → Xanh/Teal
      const r = 20, g = 184, b = 166;
      return {
        backgroundColor: `rgba(${r}, ${g}, ${b}, ${opacity})`,
        borderColor: `rgba(${r}, ${g}, ${b}, ${Math.min(1, opacity + 0.1)})`
      };
    } else {
      // avgGain === 0: Nhiều entries nhưng không tăng/giảm → Low Activity (Blue)
      const r = 59, g = 130, b = 246;
      return {
        backgroundColor: `rgba(${r}, ${g}, ${b}, ${opacity})`,
        borderColor: `rgba(${r}, ${g}, ${b}, ${Math.min(1, opacity + 0.1)})`
      };
    }
  }
  
  // Nếu không có gain data, mặc định Low Activity (Blue)
  const r = 59, g = 130, b = 246;
  return {
    backgroundColor: `rgba(${r}, ${g}, ${b}, ${opacity})`,
    borderColor: `rgba(${r}, ${g}, ${b}, ${Math.min(1, opacity + 0.1)})`
  };
};

const ActivityHeatmap = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapCell[]>([]);
  const [maxValue, setMaxValue] = useState(0);
  const [minValue, setMinValue] = useState(0);
  const [historyItems, setHistoryItems] = useState<AnalysisItem[]>([]);
  const [playerList, setPlayerList] = useState<string[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch history/analysis data from API (multiple pages)
        const allItems: AnalysisItem[] = [];
        
        for (let pageNum = 1; pageNum <= 10; pageNum++) {
          const params = new URLSearchParams();
          params.set("PageNumber", pageNum.toString());
          params.set("PageSize", "100");
          
          try {
            const data = await apiJson<unknown>(`/ai?${params.toString()}`, { method: "GET" });
            const items = normalizeHistoryItems(data);
            
            if (items.length === 0) break; // Stop if no more data
            allItems.push(...items);
          } catch (pageError) {
            console.warn(`Failed to load page ${pageNum}, stopping pagination`);
            break;
          }
        }
        
        setHistoryItems(allItems);

        // Extract unique player names
        const players = new Set<string>();
        allItems.forEach((item) => {
          (item.leaderboard ?? []).forEach((entry: any) => {
            const name = typeof entry.playerName === "string" ? entry.playerName : "";
            if (name.trim()) players.add(name.trim());
          });
        });

        const sortedPlayers = Array.from(players).sort();
        setPlayerList(sortedPlayers);
        
        // Set default to first player or empty (show all)
        if (sortedPlayers.length > 0) {
          setSelectedPlayer("");
        }

        rebuildHeatmap(allItems, "");
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to load activity data";
        setError(msg);
        console.error("Activity load error:", e);
        // Don't load sample data - show error instead to use real data
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const rebuildHeatmap = (items: AnalysisItem[], playerName: string) => {
    const activities = calculateActivityFromHistory(items, playerName || undefined);
    const grouped = groupActivityByTimeAndDay(activities);

    const cells: HeatmapCell[] = [];
    let max = 0;
    let min = Infinity;

    TIME_SLOTS.forEach((slot, timeIdx) => {
      DAYS_OF_WEEK.forEach((day, dayIdx) => {
        const dayNum = DAY_NUMBERS[dayIdx];
        const key = `${timeIdx}-${dayNum}`;
        const groupData = grouped.get(key) || { value: 0, count: 0, avgGain: 0 };

        cells.push({
          timeSlot: slot,
          day,
          dayNum,
          timeStart: timeIdx * 4,
          value: groupData.value,
          count: groupData.count,
          avgGain: groupData.avgGain,
        });

        if (groupData.value > max) max = groupData.value;
        if (groupData.value < min) min = groupData.value;
      });
    });

    setHeatmapData(cells);
    setMaxValue(max);
    setMinValue(min === Infinity ? 0 : min);
  };

  useEffect(() => {
    if (historyItems.length > 0) {
      rebuildHeatmap(historyItems, selectedPlayer);
    }
  }, [selectedPlayer]);

  useEffect(() => {
    if (historyItems.length > 0) {
      rebuildHeatmap(historyItems, selectedPlayer);
    }
  }, [selectedPlayer]);

 

  const groupedByTime = heatmapData.reduce((acc, cell) => {
    if (!acc[cell.timeSlot]) acc[cell.timeSlot] = [];
    acc[cell.timeSlot].push(cell);
    return acc;
  }, {} as Record<string, HeatmapCell[]>);

  // Tính dữ liệu theo tháng
  const monthlyStats = (() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const months: Array<{ month: string; total: number; entries: number }> = [];
    
    // Tính 12 tháng gần đây
    for (let i = 11; i >= 0; i--) {
      let month = currentMonth - i;
      let year = currentYear;
      
      if (month < 0) {
        month += 12;
        year -= 1;
      }
      
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 1);
      
      let total = 0;
      let entries = 0;
      
      historyItems.forEach((item) => {
        if (!item.processedTime) return;
        const date = parseApiDate(item.processedTime);
        if (!date) return;
        
        if (date >= startDate && date < endDate) {
          const playerName = selectedPlayer || undefined;
          if (playerName) {
            const playerEntry = (item.leaderboard ?? []).find((entry: any) => {
              const entryName = typeof entry.playerName === "string" ? entry.playerName : "";
              return entryName.toLowerCase() === playerName.toLowerCase();
            });
            if (playerEntry) {
              total += typeof playerEntry.score === "number" ? playerEntry.score : 0;
              entries += 1;
            }
          } else {
            (item.leaderboard ?? []).forEach((entry: any) => {
              total += typeof entry.score === "number" ? entry.score : 0;
            });
            if ((item.leaderboard ?? []).length > 0) entries += 1;
          }
        }
      });
      
      const monthName = new Intl.DateTimeFormat('vi-VN', { month: 'short', year: '2-digit' }).format(startDate);
      months.push({ month: monthName, total, entries });
    }
    
    return months;
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0f1629] to-[#0a0e1a] text-white">
      {/* Header with back button */}
      <div className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#0a0e1a]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-lg border border-white/[0.10] bg-white/[0.04] px-3 py-2 text-sm font-semibold text-gray-200 hover:bg-white/[0.08] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-200 text-xs font-black tracking-wide">
              <Calendar className="w-3.5 h-3.5" />
              ACTIVITY HEATMAP
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight">
              {selectedPlayer ? `${selectedPlayer}'s Activity` : "Player Activity"}
            </h1>
            <p className="text-sm text-gray-400 font-medium max-w-2xl">
              Visualize player engagement patterns throughout the week. Darker colors indicate higher activity levels based on power (lực chiến) increases.
            </p>
          </div>

          {/* Error State */}
          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200">
              ⚠️ {error}
            </div>
          )}

          {/* Legend */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-sm">
            <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">Legend</p>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded border border-blue-500/30 bg-blue-500/20" />
                <span className="text-xs text-gray-300">Low Activity</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded border border-blue-500/50 bg-blue-500/40" />
                <span className="text-xs text-gray-300">Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded border border-teal-500/60 bg-teal-500/50" />
                <span className="text-xs text-gray-300">High</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded border border-red-500/50 bg-red-500/40" />
                <span className="text-xs text-gray-300">Peak Activity</span>
              </div>
            </div>
          </div>

          {/* Player Selector */}
          {playerList.length > 0 && (
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-sm flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-300" />
                <label className="text-xs font-black text-gray-400 uppercase tracking-wider">
                  Player: 
                </label>
              </div>
              
              <select
                value={selectedPlayer}
                onChange={(e) => setSelectedPlayer(e.target.value)}
                className="flex-1 min-w-[200px] rounded-lg border border-teal-400/30 bg-teal-500/10 px-4 py-2.5 text-sm font-semibold text-teal-100 hover:bg-teal-500/15 focus:outline-none focus:ring-2 focus:ring-teal-500/50 [&>option]:bg-[#0f1629] [&>option]:text-gray-100 transition"
              >
                <option value="">All Players ({playerList.length})</option>
                {playerList.map((player) => (
                  <option key={player} value={player}>
                    {player}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Heatmap Grid */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-sm overflow-x-auto">
            {isLoading ? (
              <div className="text-center py-12 text-gray-400">Loading activity data...</div>
            ) : heatmapData.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No activity data available</div>
            ) : (
              <div className="space-y-1.5">
                {/* Day headers */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-24 flex-shrink-0" />
                  <div className="grid grid-cols-7 gap-3">
                    {DAYS_OF_WEEK.map((day) => (
                      <div key={day} className="w-16 h-14 flex items-center justify-center text-base font-bold text-gray-300">
                        {day}
                      </div>
                    ))}
                  </div>
                </div>

                {TIME_SLOTS.map((slot) => {
                  const cellsForSlot = groupedByTime[slot] || [];
                  return (
                    <div key={slot} className="flex items-center gap-4">
                      <p className="text-base font-bold text-gray-300 uppercase tracking-wider w-24 flex-shrink-0">{slot}</p>
                      <div className="grid grid-cols-7 gap-3">
                        {cellsForSlot.map((cell) => (
                          <button
                            key={`${cell.timeSlot}-${cell.day}`}
                            style={getColor(cell.value, maxValue, minValue, cell.avgGain)}
                            className={`w-16 h-14 rounded border transition-all hover:scale-110`}
                            title={`${cell.day} ${cell.timeSlot}: ${cell.value} (${cell.count} entries)${cell.avgGain !== undefined ? ` | Trend: ${cell.avgGain > 0 ? '+' : ''}${cell.avgGain.toFixed(0)}` : ''}`}
                          >
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Legend Row */}
                <div className="mt-5 pt-4 border-t border-white/[0.10]">
                  <div className="flex items-center justify-between text-base text-gray-300 font-bold">
                    <span>Thấp {minValue.toLocaleString()}</span>
                    <span>Cao {maxValue.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-sm">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Max Activity</p>
              <p className="text-2xl font-black text-teal-300 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                {maxValue.toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-sm">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Total Entries</p>
              <p className="text-2xl font-black text-white">
                {heatmapData.reduce((sum, c) => sum + c.count, 0)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-sm">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Avg Per Slot</p>
              <p className="text-2xl font-black text-white">
                {heatmapData.length > 0 ? Math.round(heatmapData.reduce((sum: number, c) => sum + c.value, 0) / heatmapData.length) : 0}
              </p>
            </div>
          </div>

          {/* Monthly Stats Chart */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-sm">
            <p className="text-sm font-black text-white mb-4">📊 Monthly</p>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyStats} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 11, fill: "#4b5563" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: "#4b5563" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => Number(v).toLocaleString('vi-VN')}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "rgba(10, 14, 26, 0.95)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      color: "#e5e7eb"
                    }}
                    formatter={(value: any) => [Number(value).toLocaleString('vi-VN'), 'Tổng lực chiến']}
                    labelStyle={{ color: '#9ca3af' }}
                  />
                  <Bar 
                    dataKey="total" 
                    fill="url(#barGradient)" 
                    radius={[8, 8, 0, 0]}
                    name="Tổng lực chiến"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityHeatmap;
