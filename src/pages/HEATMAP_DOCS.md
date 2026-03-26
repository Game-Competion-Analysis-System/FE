# Activity Heatmap - Code Explanation

## Overview
ActivityHeatmap là một trang React component hiển thị mô hình hoạt động của người chơi theo các khoảng thời gian trong tuần. Nó giúp visualize khi nào người chơi hoạt động nhất dựa trên dữ liệu lực chiến (power).

---

## 📋 Kiến Trúc Chính

### 1. **Constants & Data Structures**

```typescript
const TIME_SLOTS = ["00-04h", "04-08h", "08-12h", "12-16h", "16-20h", "20-24h"];
const DAYS_OF_WEEK = ["T2", "T3", "T4", "T5", "T6", "T7", "Chủ Nhật"];
const DAY_NUMBERS = [1, 2, 3, 4, 5, 6, 0]; // 0 = Sunday
```

- **TIME_SLOTS**: 6 khoảng thời gian trong ngày (4 giờ mỗi khoảng)
- **DAYS_OF_WEEK**: Tên các ngày (tiếng Việt)
- **DAY_NUMBERS**: Số ngày tương ứng (0 = Chủ Nhật, 1-6 = T2-T7)

### 2. **Interfaces (Type Definitions)**

```typescript
interface AnalysisItem {
  analysisId?: number;           // ID phân tích duy nhất
  processedTime?: string;        // Thời gian xử lý (ISO string)
  gameName?: string | null;      // Tên game
  serverName?: string | null;    // Tên server
  leaderboard?: Array<any>;      // Bảng xếp hạng với các player entry
}

interface ActivityData {
  timestamp: string;             // Thời điểm hoạt động
  forceIncrease: number;         // Lưu lượng lực chiến
  gain?: number;                 // Thay đổi so với lần trước (+: tăng, -: giảm)
}

interface HeatmapCell {
  timeSlot: string;              // "00-04h", "04-08h", etc.
  day: string;                   // "Mon", "Tue", etc.
  dayNum: number;                // 0-6
  timeStart: number;             // Giờ bắt đầu
  value: number;                 // Tổng lưu lượng cho heatmap
  count: number;                 // Số lần xuất hiện
  avgGain?: number;              // Trung bình gain/loss cho ô này
}
```

---

## 🔧 Các Hàm Quan Trọng

### 1. **parseApiDate(raw: string): Date | null**
```typescript
const parseApiDate = (raw: string): Date | null => {
  const s = (raw ?? "").trim();
  if (!s) return null;
  
  // Nếu backend trả ISO string không có timezone, thêm "Z"
  const looksIsoWithoutZone = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}.../.test(s);
  const isoUtc = looksIsoWithoutZone ? `${s}Z` : s;
  const d = new Date(isoUtc);
  
  return isNaN(d.getTime()) ? null : d;
};
```

**Chức năng**: Parse chuỗi ngày thành Date object
- Xử lý ISO strings không có timezone
- Trả về `null` nếu parse thất bại

---

### 2. **normalizeHistoryItems(payload: unknown): AnalysisItem[]**
```typescript
const normalizeHistoryItems = (payload: unknown): AnalysisItem[] => {
  if (Array.isArray(payload)) {
    return payload.map((item: any) => ({
      analysisId: typeof item.analysisId === "number" ? item.analysisId : undefined,
      processedTime: typeof item.processedTime === "string" ? item.processedTime : undefined,
      // ...
    }));
  }
  
  // Fallback: nếu payload là object, lấy .items array
  const obj = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const itemsRaw = Array.isArray((obj as any).items) ? (obj as any).items : [];
  return itemsRaw.map(...);
};
```

**Chức năng**: Normalize API response vào array của AnalysisItem
- Xử lý cả response là array trực tiếp hoặc wrapped trong object
- Type-check từng field để đảm bảo data integrity

---

### 3. **calculateActivityFromHistory(items: AnalysisItem[], playerName?: string): ActivityData[]**
```typescript
const calculateActivityFromHistory = (items: AnalysisItem[], playerName?: string): ActivityData[] => {
  const activities: ActivityData[] = [];

  items.forEach((item) => {
    if (!item.processedTime) return;
    
    const date = parseApiDate(item.processedTime);
    if (!date) return;

    let playerScore = 0;
    let found = false;
    
    if (playerName) {
      // Tìm player cụ thể trong leaderboard
      const playerEntry = (item.leaderboard ?? []).find((entry: any) => {
        const entryName = typeof entry.playerName === "string" ? entry.playerName : "";
        return entryName.toLowerCase() === playerName.toLowerCase();
      });
      if (playerEntry) {
        playerScore = typeof playerEntry.score === "number" ? playerEntry.score : 0;
        found = true;
      }
    } else {
      // Nếu không chọn player, cộng tất cả scores
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

  return activities;
};
```

**Chức năng**: Tính hoạt động từ lịch sử
- **Nếu có playerName**: Lấy score của player cụ thể
- **Nếu không**: Tính tổng score toàn bộ leaderboard
- Chỉ include records khi player thực sự xuất hiện
- **Fix**: Thay đổi từ `playerScore > 0` thành `found && playerScore >= 0` để không bỏ qua lần score = 0

---

### 4. **getTimeSlotIndex(hour: number): number**
```typescript
const getTimeSlotIndex = (hour: number): number => {
  if (hour < 4) return 0;        // 00-04h → index 0
  if (hour < 8) return 1;        // 04-08h → index 1
  if (hour < 12) return 2;       // 08-12h → index 2
  if (hour < 16) return 3;       // 12-16h → index 3
  if (hour < 20) return 4;       // 16-20h → index 4
  return 5;                      // 20-24h → index 5
};
```

**Chức năng**: Map giờ hiện tại → time slot index

---

### 5. **groupActivityByTimeAndDay(activities: ActivityData[]): Map**
```typescript
const groupActivityByTimeAndDay = (activities: ActivityData[]): Map<string, { value: number; count: number }> => {
  const grouped = new Map();

  activities.forEach((activity) => {
    try {
      const date = new Date(activity.timestamp);
      const hour = date.getHours();
      const dayNum = date.getDay();

      const timeSlotIdx = getTimeSlotIndex(hour);
      const key = `${timeSlotIdx}-${dayNum}`;

      const existing = grouped.get(key) || { value: 0, count: 0 };
      grouped.set(key, {
        value: existing.value + activity.forceIncrease,
        count: existing.count + 1,
      });
    } catch (e) {
      console.error("Invalid timestamp:", activity.timestamp);
    }
  });

  return grouped;
};
```

**Chức năng**: Nhóm hoạt động theo (time slot, day) key
- **Key format**: `"${timeSlotIdx}-${dayNum}"` (e.g., "0-1" = Monday 00-04h)
- **Value**: { value: tổng lưu lượng, count: số lần }

---

### 6. **getColor(value: number, maxValue: number, minValue: number, avgGain?: number): object**
```typescript
const getColor = (value: number, maxValue: number, minValue: number, avgGain?: number): object => {
  // Tính ratio của value trong range
  const ratio = (value - minValue) / (maxValue - minValue);
  const opacity = 0.2 + ratio * 0.8;  // 0.2 - 1.0
  
  // Xác định màu dựa vào trend (avgGain)
  if (avgGain !== undefined && avgGain < 0) {
    // Trend giảm → màu đỏ (downtrend)
    return {
      backgroundColor: `rgba(239, 68, 68, ${opacity})`,
      borderColor: `rgba(239, 68, 68, 0.5)`,
      color: '#fca5a5'
    };
  } else if (avgGain !== undefined && avgGain > 0) {
    // Trend tăng → màu xanh (uptrend)
    return {
      backgroundColor: `rgba(20, 184, 166, ${opacity})`,
      borderColor: `rgba(20, 184, 166, 0.5)`,
      color: '#6ee7b7'
    };
  } else {
    // Không có trend data → màu xám trung tính
    return {
      backgroundColor: `rgba(75, 85, 99, ${opacity})`,
      borderColor: `rgba(75, 85, 99, 0.5)`,
      color: '#e5e7eb'
    };
  }
};
```

**Chức năng**: Tính style object dựa trên giá trị và trend
- **Opacity** (0.2 ~ 1.0): Dựa trên intensity (value/max)
  - Thấp → 0.2 (nhạt)
  - Cao → 1.0 (đậm)
- **Màu sắc**: Dựa trên avgGain (thay đổi so với lần trước)
  - `avgGain < 0`: 🔴 Giảm (downtrend) → đỏ
  - `avgGain > 0`: 🟢 Tăng (uptrend) → xanh/teal
  - `avgGain = 0` hoặc undefined: ⚫ Trung tính → xám

---

## 🔄 Component Flow

```
useEffect (on mount)
    ↓
fetch all pages (loop từ page 1 đến hết)
    ↓
normalizeHistoryItems()
    ↓
extract unique players
    ↓
setPlayerList()
    ↓
rebuildHeatmap(items, "")
    ↓
[Player Selector UI]
    ↓
onChange: selectedPlayer
    ↓
useEffect triggers
    ↓
rebuildHeatmap(items, selectedPlayer)
    ↓
[Heatmap Updates]
```

---

## 📊 Heatmap Rendering Flow

```
rebuildHeatmap(items, playerName)
    ↓
calculateActivityFromHistory(items, playerName)
    → returns: ActivityData[] (timestamp + score)
    ↓
groupActivityByTimeAndDay(activities)
    → returns: Map<"timeSlot-dayNum", {value, count}>
    ↓
Build HeatmapCell[] (6 time slots × 7 days = 42 cells)
    ↓
Calculate maxValue & minValue
    ↓
setHeatmapData(cells)
setMaxValue(max)
setMinValue(min)
    ↓
[UI Layer]
    ↓
render cells với getColor()
```

---

## 🎯 Key Features

### 1. **Multi-Page Data Loading**
```typescript
for (let pageNum = 1; pageNum <= 10; pageNum++) {
  const res = await readHistory({...});
  if (!pageItems || pageItems.length === 0) break;
  allItems.push(...pageItems);
}
```
- Loop qua tối đa 10 pages (hoặc cho đến khi API trả về 0 items)
- Dừng khi API trả về 0 items
- Gộp toàn bộ data

### 2. **Trend Detection (Gain/Loss)**
```typescript
// Sau khi sort activities by timestamp, tính gain
activities.forEach((current, idx) => {
  if (idx > 0) {
    current.gain = current.forceIncrease - activities[idx - 1].forceIncrease;
  }
});
```
- **Gain > 0**: Lực chiến tăng so với lần trước → màu xanh/teal
- **Gain < 0**: Lực chiến giảm so với lần trước → màu đỏ
- **Gain = 0**: Không thay đổi → màu xám

### 3. **Player Selection**
```typescript
<select value={selectedPlayer} onChange={(e) => setSelectedPlayer(e.target.value)}>
  <option value="">All Players ({playerList.length})</option>
  {playerList.map((player) => (
    <option key={player} value={player}>{player}</option>
  ))}
</select>
```
- Option "All Players": hiển thị tổng activity
- Option từng player: filter activity của player cụ thể

### 4. **Monthly Stats Visualization**
```typescript
<ResponsiveContainer width="100%" height="100%">
  <BarChart data={monthlyStats} margin={{...}}>
    <CartesianGrid strokeDasharray="3 3" stroke="rgba(...)" />
    <XAxis dataKey="month" />
    <YAxis />
    <Tooltip />
    <Bar dataKey="total" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
  </BarChart>
</ResponsiveContainer>
```
- Biểu đồ 12 tháng lịch sử
- Gradient bars từ teal → cyan
- Hover tooltip với giá trị chính xác
- Vietnamese locale formatting for numbers

### 5. **Error Handling**
```typescript
if (error && (
  <div className="...">
    ⚠️ {error}
  </div>
))
```
- Hiển thị error message thay vì fake data
- Giúp debug vấn đề API

---

## 📈 Monthly Stats Chart

Component này cũng hiển thị biểu đồ lịch sử 12 tháng:

```typescript
const monthlyStats = (() => {
  const stats: Array<{ month: string; total: number; entries: number }> = [];
  
  // Tính 12 tháng
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    
    const startDate = new Date(d.getFullYear(), d.getMonth(), 1);
    const endDate = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    
    // Tính tổng score và entries của tháng này
    let monthTotal = 0;
    let monthEntries = 0;
    
    historyItems.forEach((item) => {
      const itemDate = parseApiDate(item.processedTime);
      if (itemDate && itemDate >= startDate && itemDate < endDate) {
        monthTotal += (item.leaderboard ?? []).length > 0 ? 
          (item.leaderboard ?? []).reduce((s: number, e: any) => s + (e.score ?? 0), 0) : 0;
        monthEntries++;
      }
    });
    
    stats.push({
      month: `T${d.getMonth() + 1} '${String(d.getFullYear()).slice(-2)}`,
      total: monthTotal,
      entries: monthEntries
    });
  }
  
  return stats;
})();
```

**Biểu đồ**: Sử dụng Recharts BarChart
- **X-axis**: Tháng (T1 '26, T2 '26, ...)
- **Y-axis**: Tổng score
- **Theme**: Gradient teal với dark background
- **Tooltip**: Hiển thị giá trị chính xác khi hover

---

## 🔍 Data Flow (Chi Tiết)

### Scenario: Xem activity của player "[Võ Thịnh] _ _End_ _"

**Step 1**: Load từ API
```
Page 1: [item1, item2, item3] → leaderboard chứa "[Võ Thịnh]"
Page 2: [item4, item5] → leaderboard chứa "[Võ Thịnh]"
...
Page 10: [item40, item41] → không có "[Võ Thịnh]" nữa
```

**Step 2**: Extract players từ all items
```
players = {"[Võ Thịnh]", "Alice", "Bob", ...}
```

**Step 3**: User chọn "[Võ Thịnh]"
```
selectedPlayer = "[Võ Thịnh]"
```

**Step 4**: Calculate activity
```
items = tất cả items từ tất cả pages
playerName = "[Võ Thịnh]"

→ Tìm từng item, extract score của "[Võ Thịnh]"
→ Filter chỉ lấy entries có "[Võ Thịnh]"
```

**Step 5**: Group by time & day
```
{
  "0-1": { value: 500, count: 3 },      // Monday 00-04h: 3 appearances, total 500
  "2-3": { value: 1200, count: 5 },     // Wednesday 08-12h: 5 appearances, total 1200
  ...
}
```

**Step 6**: Render heatmap
```
[Activity Heatmap bảng 6×7 với màu sắc]
```

---

## ⚠️ Important Notes

### 1. **Date Parsing Bug Fix**
Backend có thể trả ISO string không timezone:
```typescript
// Before: "2026-03-13T01:49:00"
// After: "2026-03-13T01:49:00Z"
```
Thêm "Z" để treat as UTC, giúp hiển thị correct local time.

### 2. **Score = 0 Handling**
```typescript
// Old: if (playerScore > 0)
// New: if (found && playerScore >= 0)
```
Thay đổi này đảm bảo không bỏ qua lần player xuất hiện với score = 0.

### 3. **Trend Detection (Gain)**
```typescript
// Sort activities by timestamp, then calculate gain
activities.sort((a, b) => 
  new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
);
activities.forEach((current, idx) => {
  if (idx > 0) {
    current.gain = current.forceIncrease - activities[idx - 1].forceIncrease;
  }
});
```
- Sorting **bắt buộc** trước khi tính gain
- `gain > 0` → uptrend (teal), `gain < 0` → downtrend (red)

### 4. **Monthly Stats Calculation**
- Tính 12 tháng ngược lại từ hiện tại
- Group historyItems by month range (1st → last day)
- Sum scores + count entries per month
- Data ready cho chart visualization

### 5. **Performance**
- Multi-page loading có thể chậm nếu dữ liệu lớn
- Component không có cancel/abort mechanism nếu user navigate away
- Có thể thêm AbortController cho request cancellation

### 6. **Recharts Integration**
- Import: `BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer`
- ResponsiveContainer với height: "h-80"
- Gradient fill cho visual appeal
- Vietnamese locale formatting: `.toLocaleString('vi-VN')`

---

## 🎨 UI Components

### 1. **Header**
- Back button
- Title: "Player Activity" hoặc "{selectedPlayer}'s Activity"
- Description

### 2. **Legend**
Coloring system dựa trên trend:
- 🔴 **Red**: Lực chiến giảm (downtrend)
- 🟢 **Teal**: Lực chiến tăng (uptrend)
- ⚫ **Gray**: Trung tính (no trend data)
- **Opacity**: Dựa trên intensity (0.2 ~ 1.0)

### 3. **Player Selector**
- Dropdown select từ playerList
- Show "All Players (n)"
- Dynamic heatmap update

### 4. **Heatmap Grid**
- Header row: days (Mon-Sun)
- 6 rows × 7 columns = 42 cells
- Color: opacity + trend
- Hover tooltip: day, time, value, count, trend

### 5. **Stats Cards**
- Max Activity
- Total Entries
- Average per Slot

### 6. **Monthly Stats Chart**
- BarChart visualization (12 months)
- Teal gradient bars
- X-axis: Month labels (T1 '26, T2 '26, ...)
- Y-axis: Total scores (Vietnamese locale formatting)
- Hover tooltip: Month + exact value

---

## 📝 Summary

ActivityHeatmap component:
✅ Fetches multi-page data (tối đa 10 pages, auto-stop khi hết data)
✅ Normalizes & validates data structure
✅ Calculates player activity từ leaderboard
✅ Detects trend/gain (tăng/giảm so với lần trước)
✅ Groups by time slot & day
✅ Visualizes với color-coded heatmap (màu based on trend + opacity)
✅ Supports player filtering & selection
✅ Shows aggregated stats (Max, Total, Average)
✅ Displays monthly statistics as BarChart (12 months)

**Main Logic**: 
1. Activity = Score × Timestamp → Sort chronologically
2. Gain = Current - Previous (detect trend)
3. Group by (weekday, time slot) → Calculate avgGain
4. Color by (trend + intensity) + Monthly rollup → Chart visualization
