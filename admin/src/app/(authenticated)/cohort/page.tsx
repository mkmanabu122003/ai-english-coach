"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface CohortUser {
  lineUserId: string;
  plan: string;
  lastActiveDate: string;
  createdAt: { _seconds: number; _nanoseconds: number };
}

interface CohortRow {
  weekLabel: string;
  totalUsers: number;
  retention: Record<string, number | null>; // week key -> percentage
}

const RETENTION_WEEKS = ["W1", "W2", "W3", "W4", "W8", "W12"];
const RETENTION_WEEK_NUMBERS: Record<string, number> = {
  W1: 1,
  W2: 2,
  W3: 3,
  W4: 4,
  W8: 8,
  W12: 12,
};

function getISOWeekLabel(date: Date): string {
  // Get ISO week number
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function getWeekStartDate(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  return new Date(d.setDate(diff));
}

function getRetentionColor(pct: number | null): string {
  if (pct === null) return "bg-gray-100 text-gray-400";
  if (pct >= 80) return "bg-green-600 text-white";
  if (pct >= 60) return "bg-green-500 text-white";
  if (pct >= 40) return "bg-green-400 text-white";
  if (pct >= 20) return "bg-yellow-400 text-gray-900";
  if (pct >= 10) return "bg-orange-400 text-white";
  return "bg-red-500 text-white";
}

export default function CohortPage() {
  const [users, setUsers] = useState<CohortUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<"en" | "es">("en");
  const [planFilter, setPlanFilter] = useState<string>("all");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users?lang=${lang}&limit=10000`);
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data.users ?? []);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const cohortData = useMemo(() => {
    // Filter by plan
    let filteredUsers = users;
    if (planFilter === "free") {
      filteredUsers = users.filter((u) => u.plan === "free");
    } else if (planFilter === "bot_pro") {
      filteredUsers = users.filter((u) => u.plan === "bot_pro");
    }

    // Group users by registration week
    const cohortMap = new Map<string, CohortUser[]>();

    for (const user of filteredUsers) {
      const createdAtSeconds =
        user.createdAt?._seconds || (user.createdAt as Record<string, number>)?.seconds || 0;
      if (!createdAtSeconds) continue;

      const createdDate = new Date(createdAtSeconds * 1000);
      const weekLabel = getISOWeekLabel(createdDate);

      if (!cohortMap.has(weekLabel)) {
        cohortMap.set(weekLabel, []);
      }
      cohortMap.get(weekLabel)!.push(user);
    }

    // Sort by week label
    const sortedWeeks = Array.from(cohortMap.keys()).sort();

    const now = new Date();

    // Calculate retention for each cohort
    const rows: CohortRow[] = sortedWeeks.map((weekLabel) => {
      const cohortUsers = cohortMap.get(weekLabel)!;
      const totalUsers = cohortUsers.length;

      // Get the Monday of the registration week for baseline
      const firstUser = cohortUsers[0];
      const firstCreatedSeconds =
        firstUser.createdAt?._seconds || (firstUser.createdAt as Record<string, number>)?.seconds || 0;
      const registrationDate = new Date(firstCreatedSeconds * 1000);
      const cohortWeekStart = getWeekStartDate(registrationDate);

      const retention: Record<string, number | null> = {};

      for (const weekKey of RETENTION_WEEKS) {
        const weekNumber = RETENTION_WEEK_NUMBERS[weekKey];

        // Calculate the start/end of the target week
        const targetWeekStart = new Date(cohortWeekStart);
        targetWeekStart.setDate(
          targetWeekStart.getDate() + weekNumber * 7
        );
        const targetWeekEnd = new Date(targetWeekStart);
        targetWeekEnd.setDate(targetWeekEnd.getDate() + 7);

        // If the target week hasn't happened yet, mark as null
        if (targetWeekStart > now) {
          retention[weekKey] = null;
          continue;
        }

        // Count users active during the target week
        const targetStartStr = targetWeekStart.toISOString().slice(0, 10);
        const targetEndStr = targetWeekEnd.toISOString().slice(0, 10);

        const activeCount = cohortUsers.filter((u) => {
          const lastActive = u.lastActiveDate;
          if (!lastActive) return false;
          return lastActive >= targetStartStr && lastActive < targetEndStr;
        }).length;

        retention[weekKey] =
          totalUsers > 0
            ? Math.round((activeCount / totalUsers) * 100)
            : 0;
      }

      return { weekLabel, totalUsers, retention };
    });

    return rows;
  }, [users, planFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">
            コホートデータを計算中...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">コホート分析</h1>
          <p className="text-sm text-muted-foreground">
            登録週ごとのリテンション率を分析します
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Language toggle */}
          <div className="flex items-center gap-1 rounded-lg border p-1">
            <button
              onClick={() => setLang("en")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                lang === "en"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang("es")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                lang === "es"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              ES
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-end">
        <div className="space-y-2">
          <Label>プランフィルタ</Label>
          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="bot_pro">Pro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cohort Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            リテンションヒートマップ
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cohortData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              データがありません
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium">
                      コホート
                    </th>
                    <th className="text-center py-2 px-3 font-medium">
                      ユーザー数
                    </th>
                    {RETENTION_WEEKS.map((w) => (
                      <th
                        key={w}
                        className="text-center py-2 px-3 font-medium"
                      >
                        {w}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cohortData.map((row) => (
                    <tr key={row.weekLabel} className="border-b last:border-0">
                      <td className="py-2 px-3 font-mono text-xs">
                        {row.weekLabel}
                      </td>
                      <td className="text-center py-2 px-3">
                        {row.totalUsers}
                      </td>
                      {RETENTION_WEEKS.map((w) => {
                        const pct = row.retention[w];
                        return (
                          <td key={w} className="text-center py-2 px-3">
                            <span
                              className={`inline-block rounded px-2 py-1 text-xs font-medium min-w-[48px] ${getRetentionColor(
                                pct
                              )}`}
                            >
                              {pct === null ? "-" : `${pct}%`}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span>凡例:</span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-4 h-4 rounded bg-green-600" />
          80%+
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-4 h-4 rounded bg-green-500" />
          60-79%
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-4 h-4 rounded bg-green-400" />
          40-59%
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-4 h-4 rounded bg-yellow-400" />
          20-39%
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-4 h-4 rounded bg-orange-400" />
          10-19%
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-4 h-4 rounded bg-red-500" />
          0-9%
        </span>
      </div>
    </div>
  );
}
