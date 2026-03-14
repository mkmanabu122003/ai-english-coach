import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, UserPlus, ShieldAlert } from "lucide-react";
import type { DailyStats } from "@/types";

interface ChurnRiskUser {
  lineUserId: string;
  displayName: string;
  healthScore: number;
  language: string;
}

interface ActionPanelProps {
  churnRiskUsers: ChurnRiskUser[];
  stats: DailyStats | null;
}

function healthScoreBadge(score: number) {
  if (score >= 70) {
    return "bg-green-100 text-green-800";
  }
  if (score >= 30) {
    return "bg-yellow-100 text-yellow-800";
  }
  return "bg-red-100 text-red-800";
}

export function ActionPanel({ churnRiskUsers, stats }: ActionPanelProps) {
  const rateLimitHitsEn = stats?.rateLimitHits?.en ?? 0;
  const rateLimitHitsEs = stats?.rateLimitHits?.es ?? 0;
  const totalRateLimitHits = rateLimitHitsEn + rateLimitHitsEs;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          今日やるべきこと
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Section 1: Churn risk users */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-red-500" />
            離脱リスク Top 5
          </h4>
          {churnRiskUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              該当ユーザーなし
            </p>
          ) : (
            <ul className="space-y-2">
              {churnRiskUsers.map((user) => (
                <li key={user.lineUserId}>
                  <Link
                    href={`/users/${user.lineUserId}?lang=${user.language}`}
                    className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-sm font-medium truncate">
                      {user.displayName}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${healthScoreBadge(user.healthScore)}`}
                    >
                      {user.healthScore}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Section 2: Onboarding incomplete */}
        <div>
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-blue-500" />
            オンボーディング未完了
          </h4>
          <Link
            href="/users?preset=onboardingIncomplete"
            className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50 transition-colors"
          >
            <span className="text-sm">未完了ユーザー一覧を確認</span>
            <span className="text-sm text-primary font-medium">表示 →</span>
          </Link>
        </div>

        {/* Section 3: Rate limit hits */}
        <div>
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            無料上限到達
          </h4>
          <Link
            href="/users"
            className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50 transition-colors"
          >
            <span className="text-sm">
              本日{" "}
              <span className="font-bold text-orange-600">
                {totalRateLimitHits}
              </span>{" "}
              件
            </span>
            <span className="text-sm text-primary font-medium">表示 →</span>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
