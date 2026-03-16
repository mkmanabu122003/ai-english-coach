"use client";

import { useEffect, useState } from "react";
import {
  Users,
  MessageSquare,
  Mic,
  TrendingUp,
  Zap,
  UserPlus,
  UserMinus,
  Crown,
} from "lucide-react";
import type { DailyStats, LangSplit } from "@/types";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { FunnelChart } from "@/components/dashboard/FunnelChart";
import { TrendChart } from "@/components/charts/TrendChart";
import { TokenChart } from "@/components/charts/TokenChart";
import { ActionPanel } from "@/components/dashboard/ActionPanel";

interface RangeStatsEntry {
  date: string;
  stats: DailyStats;
}

interface ChurnRiskUser {
  lineUserId: string;
  displayName: string;
  healthScore: number;
  language: string;
}

function langVal(split: LangSplit | undefined, lang: "en" | "es"): number {
  if (!split) return 0;
  return split[lang] ?? 0;
}

export default function DashboardPage() {
  const [todayStats, setTodayStats] = useState<DailyStats | null>(null);
  const [rangeStats, setRangeStats] = useState<RangeStatsEntry[]>([]);
  const [churnRiskUsers, setChurnRiskUsers] = useState<ChurnRiskUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<"en" | "es">("en");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Build date range for last 30 days
        const now = new Date();
        const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
        const end = jstNow.toISOString().slice(0, 10);
        const start30 = new Date(jstNow.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

        const [todayRes, rangeRes, churnRes] = await Promise.all([
          fetch("/api/stats/daily"),
          fetch(`/api/stats/range?start=${start30}&end=${end}`),
          fetch(`/api/users?preset=churnRisk&limit=5&lang=${lang}`),
        ]);

        if (todayRes.ok) {
          const todayData = await todayRes.json();
          setTodayStats(todayData.stats ?? null);
        }

        if (rangeRes.ok) {
          const rangeData = await rangeRes.json();
          setRangeStats(Array.isArray(rangeData) ? rangeData : []);
        }

        if (churnRes.ok) {
          const churnData = await churnRes.json();
          setChurnRiskUsers(
            Array.isArray(churnData)
              ? churnData
              : churnData.users ?? []
          );
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [lang]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">
            ダッシュボードを読み込み中...
          </p>
        </div>
      </div>
    );
  }

  // Build trend data from rangeStats
  const dauTrend = rangeStats.map((entry) => ({
    date: entry.date,
    value: langVal(entry.stats.dau, lang),
  }));

  const textChatTrend = rangeStats.map((entry) => ({
    date: entry.date,
    value: langVal(entry.stats.textChats, lang),
  }));

  const voiceChatTrend = rangeStats.map((entry) => ({
    date: entry.date,
    value: langVal(entry.stats.voiceChats, lang),
  }));

  const newFollowsTrend = rangeStats.map((entry) => ({
    date: entry.date,
    value: langVal(entry.stats.newFollows, lang),
  }));

  const tokenTrend = rangeStats.map((entry) => ({
    date: entry.date,
    prompt: langVal(entry.stats.promptTokens, lang),
    completion: langVal(entry.stats.completionTokens, lang),
  }));

  // Funnel data
  const totalUsers = langVal(todayStats?.totalUsers, lang);
  const firstChatUsers = langVal(todayStats?.firstChatUsers, lang);
  const activeUsers = langVal(todayStats?.activeUsers, lang);
  const proUsers = langVal(todayStats?.proUsers, lang);

  const funnelData = [
    {
      label: "友だち追加",
      value: totalUsers,
      rate: "100%",
    },
    {
      label: "初回チャット",
      value: firstChatUsers,
      rate: totalUsers > 0 ? `${((firstChatUsers / totalUsers) * 100).toFixed(1)}%` : "0%",
    },
    {
      label: "7日継続",
      value: activeUsers,
      rate: firstChatUsers > 0 ? `${((activeUsers / firstChatUsers) * 100).toFixed(1)}%` : "0%",
    },
    {
      label: "Pro転換",
      value: proUsers,
      rate: activeUsers > 0 ? `${((proUsers / activeUsers) * 100).toFixed(1)}%` : "0%",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with language toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ダッシュボード</h1>
          <p className="text-sm text-muted-foreground">
            本日の概況とトレンド
          </p>
        </div>
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

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="総ユーザー数"
          value={langVal(todayStats?.totalUsers, lang).toLocaleString()}
          subtitle={`アクティブ: ${langVal(todayStats?.activeUsers, lang).toLocaleString()}`}
          icon={<Users className="h-5 w-5" />}
        />
        <KpiCard
          title="DAU"
          value={langVal(todayStats?.dau, lang).toLocaleString()}
          subtitle={`平均ストリーク: ${langVal(todayStats?.avgStreak, lang).toFixed(1)}日`}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <KpiCard
          title="テキストチャット"
          value={langVal(todayStats?.textChats, lang).toLocaleString()}
          subtitle="本日の送信数"
          icon={<MessageSquare className="h-5 w-5" />}
        />
        <KpiCard
          title="ボイスチャット"
          value={langVal(todayStats?.voiceChats, lang).toLocaleString()}
          subtitle="本日の送信数"
          icon={<Mic className="h-5 w-5" />}
        />
        <KpiCard
          title="新規フォロー"
          value={langVal(todayStats?.newFollows, lang).toLocaleString()}
          subtitle={`解除: ${langVal(todayStats?.unfollows, lang).toLocaleString()}`}
          icon={<UserPlus className="h-5 w-5" />}
        />
        <KpiCard
          title="Pro ユーザー"
          value={langVal(todayStats?.proUsers, lang).toLocaleString()}
          subtitle={`転換: ${langVal(todayStats?.proConversions, lang).toLocaleString()}件`}
          icon={<Crown className="h-5 w-5" />}
        />
        <KpiCard
          title="平均ヘルススコア"
          value={langVal(todayStats?.avgHealthScore, lang).toFixed(1)}
          subtitle={`離脱リスク: ${langVal(todayStats?.churnRiskCount, lang)}人`}
          icon={<Zap className="h-5 w-5" />}
        />
        <KpiCard
          title="無料上限到達"
          value={langVal(todayStats?.rateLimitHits, lang).toLocaleString()}
          subtitle="本日の件数"
          icon={<UserMinus className="h-5 w-5" />}
        />
      </div>

      {/* Funnel Section */}
      <FunnelChart data={funnelData} />

      {/* Trend Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TrendChart
          data={dauTrend}
          title="DAU 推移（過去30日）"
          color="#3b82f6"
          type="line"
        />
        <TrendChart
          data={textChatTrend}
          title="テキストチャット数 推移"
          color="#8b5cf6"
          type="bar"
        />
        <TrendChart
          data={voiceChatTrend}
          title="ボイスチャット数 推移"
          color="#10b981"
          type="bar"
        />
        <TrendChart
          data={newFollowsTrend}
          title="新規フォロー 推移"
          color="#f59e0b"
          type="line"
        />
      </div>

      {/* Token Cost Chart */}
      <TokenChart data={tokenTrend} title="トークン料金 推移（過去30日）" />

      {/* Action Panel */}
      <ActionPanel churnRiskUsers={churnRiskUsers} stats={todayStats} />
    </div>
  );
}
