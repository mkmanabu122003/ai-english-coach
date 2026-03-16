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

// Claude Sonnet 4 pricing (USD per token)
const INPUT_COST_PER_TOKEN = 3 / 1_000_000; // $3 per 1M tokens
const OUTPUT_COST_PER_TOKEN = 15 / 1_000_000; // $15 per 1M tokens

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

function formatCost(value: number): string {
  if (value >= 1) return `$${value.toFixed(2)}`;
  if (value >= 0.01) return `$${value.toFixed(3)}`;
  return `$${value.toFixed(4)}`;
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

  // Transform data for chart with cost calculation
  const chartData = data.map((entry) => {
    const dateKey = entry.date || entry.month || "";
    const prompt = entry.promptTokens?.[lang] ?? 0;
    const completion = entry.completionTokens?.[lang] ?? 0;
    return {
      date: dateKey,
      inputCost: prompt * INPUT_COST_PER_TOKEN,
      outputCost: completion * OUTPUT_COST_PER_TOKEN,
      promptTokens: prompt,
      completionTokens: completion,
    };
  });

  // Calculate summary stats
  const totalPrompt = chartData.reduce((sum, d) => sum + d.promptTokens, 0);
  const totalCompletion = chartData.reduce(
    (sum, d) => sum + d.completionTokens,
    0
  );
  const totalInputCost = totalPrompt * INPUT_COST_PER_TOKEN;
  const totalOutputCost = totalCompletion * OUTPUT_COST_PER_TOKEN;
  const totalCost = totalInputCost + totalOutputCost;
  const avgCostPerDay =
    chartData.length > 0 ? totalCost / chartData.length : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">トークン料金</h1>
          <p className="text-sm text-muted-foreground">
            AIモデルの利用料金を分析します（Claude Sonnet 4）
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
              合計料金
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">
              {formatCost(totalCost)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {(totalPrompt + totalCompletion).toLocaleString()} tokens
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Input 料金
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {formatCost(totalInputCost)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {totalPrompt.toLocaleString()} tokens
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Output 料金
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatCost(totalOutputCost)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {totalCompletion.toLocaleString()} tokens
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
              {formatCost(avgCostPerDay)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              /{period === "daily" ? "日" : "月"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            トークン料金推移
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
                  <YAxis
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip
                    labelFormatter={(label) =>
                      period === "daily" ? `日付: ${label}` : `月: ${label}`
                    }
                    formatter={(value: number, name: string, props) => {
                      const { payload } = props;
                      if (name === "inputCost") {
                        return [
                          `${formatCost(value)}（${payload.promptTokens.toLocaleString()} tokens）`,
                          "Input",
                        ];
                      }
                      return [
                        `${formatCost(value)}（${payload.completionTokens.toLocaleString()} tokens）`,
                        "Output",
                      ];
                    }}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    formatter={(value: string) =>
                      value === "inputCost" ? "Input" : "Output"
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="inputCost"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="outputCost"
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
