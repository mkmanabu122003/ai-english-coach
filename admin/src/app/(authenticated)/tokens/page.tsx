"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TokenEntry {
  date?: string;
  month?: string;
  promptTokens: { en: number; es: number };
  completionTokens: { en: number; es: number };
}

function getTodayJST(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

function getDefaultStart(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  jst.setDate(jst.getDate() - 30);
  return jst.toISOString().slice(0, 10);
}

function formatDateLabel(dateStr: string): string {
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)}`;
  }
  return dateStr;
}

export default function TokensPage() {
  const [startDate, setStartDate] = useState(getDefaultStart());
  const [endDate, setEndDate] = useState(getTodayJST());
  const [period, setPeriod] = useState<"daily" | "monthly">("daily");
  const [lang, setLang] = useState<"en" | "es">("en");
  const [data, setData] = useState<TokenEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        period,
        start: startDate,
        end: endDate,
      });
      const res = await fetch(`/api/stats/tokens?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch token data");
      const result = await res.json();
      setData(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error("Error fetching token data:", err);
    } finally {
      setLoading(false);
    }
  }, [period, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Transform data for chart
  const chartData = data.map((entry) => {
    const dateKey = entry.date || entry.month || "";
    return {
      date: dateKey,
      prompt: entry.promptTokens?.[lang] ?? 0,
      completion: entry.completionTokens?.[lang] ?? 0,
    };
  });

  // Calculate summary stats
  const totalPrompt = chartData.reduce((sum, d) => sum + d.prompt, 0);
  const totalCompletion = chartData.reduce((sum, d) => sum + d.completion, 0);
  const totalTokens = totalPrompt + totalCompletion;
  const avgPerDay =
    chartData.length > 0 ? Math.round(totalTokens / chartData.length) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">トークン使用量</h1>
          <p className="text-sm text-muted-foreground">
            AIモデルのトークン消費量を分析します
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

      {/* Controls */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label>開始日</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-44"
          />
        </div>
        <div className="space-y-2">
          <Label>終了日</Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-44"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border p-1">
          <button
            onClick={() => setPeriod("daily")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              period === "daily"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            日別
          </button>
          <button
            onClick={() => setPeriod("monthly")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              period === "monthly"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            月別
          </button>
        </div>
        <Button onClick={fetchData} variant="outline" disabled={loading}>
          {loading ? "読み込み中..." : "更新"}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              合計トークン
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {totalTokens.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Prompt Tokens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {totalPrompt.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Completion Tokens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {totalCompletion.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              {period === "daily" ? "1日平均" : "1月平均"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {avgPerDay.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            トークン使用量推移
            {period === "daily" ? "（日別）" : "（月別）"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-80 flex items-center justify-center text-muted-foreground">
              読み込み中...
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-80 flex items-center justify-center text-muted-foreground">
              データがありません
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDateLabel}
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                  <Tooltip
                    labelFormatter={(label) =>
                      period === "daily" ? `日付: ${label}` : `月: ${label}`
                    }
                    formatter={(value: number, name: string) => [
                      value.toLocaleString(),
                      name === "prompt"
                        ? "Prompt Tokens"
                        : "Completion Tokens",
                    ]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    formatter={(value: string) =>
                      value === "prompt"
                        ? "Prompt Tokens"
                        : "Completion Tokens"
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="prompt"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="completion"
                    stackId="1"
                    stroke="#22c55e"
                    fill="#22c55e"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
