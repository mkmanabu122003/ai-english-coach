"use client";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Claude Sonnet 4 pricing (USD per token)
const INPUT_COST_PER_TOKEN = 3 / 1_000_000; // $3 per 1M tokens
const OUTPUT_COST_PER_TOKEN = 15 / 1_000_000; // $15 per 1M tokens

interface TokenChartProps {
  data: { date: string; prompt: number; completion: number }[];
  title: string;
}

function formatDateLabel(dateStr: string): string {
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parseInt(parts[2], 10)}`;
  }
  return dateStr;
}

function formatCost(value: number): string {
  if (value >= 1) return `$${value.toFixed(2)}`;
  if (value >= 0.01) return `$${value.toFixed(3)}`;
  return `$${value.toFixed(4)}`;
}

export function TokenChart({ data, title }: TokenChartProps) {
  const costData = data.map((d) => ({
    date: d.date,
    inputCost: d.prompt * INPUT_COST_PER_TOKEN,
    outputCost: d.completion * OUTPUT_COST_PER_TOKEN,
    promptTokens: d.prompt,
    completionTokens: d.completion,
  }));

  const totalInputCost = costData.reduce((s, d) => s + d.inputCost, 0);
  const totalOutputCost = costData.reduce((s, d) => s + d.outputCost, 0);
  const totalCost = totalInputCost + totalOutputCost;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          <span className="text-lg font-bold text-orange-600">
            {formatCost(totalCost)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Input: {formatCost(totalInputCost)} / Output: {formatCost(totalOutputCost)}
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={costData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
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
                labelFormatter={(label) => `日付: ${label}`}
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
      </CardContent>
    </Card>
  );
}
