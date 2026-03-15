"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import type { User, ChatLog, WeeklyReport } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HealthScoreBadge } from "@/components/users/HealthScoreBadge";
import { OnboardingProgress } from "@/components/users/OnboardingProgress";
import { PlanChangeDialog } from "@/components/users/PlanChangeDialog";

function formatTimestamp(ts: { _seconds: number; _nanoseconds: number } | null | undefined): string {
  if (!ts || typeof ts._seconds !== "number") return "-";
  return new Date(ts._seconds * 1000).toLocaleString("ja-JP");
}

function formatDate(ts: { _seconds: number; _nanoseconds: number } | null | undefined): string {
  if (!ts || typeof ts._seconds !== "number") return "-";
  return new Date(ts._seconds * 1000).toLocaleDateString("ja-JP");
}

// Generate last 7 days as YYYY-MM-DD strings
function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

export default function UserDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const userId = params.userId as string;
  const lang = searchParams.get("lang") || "en";

  const [user, setUser] = useState<User | null>(null);
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chat logs state
  const [chatLogs, setChatLogs] = useState<ChatLog[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatTypeFilter, setChatTypeFilter] = useState<"all" | "text" | "voice">("all");
  const [chatHasMore, setChatHasMore] = useState(true);
  const [chatPage, setChatPage] = useState(1);

  // Weekly reports expand state
  const [expandedReports, setExpandedReports] = useState<Set<number>>(new Set());

  // Admin actions state
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [newLevel, setNewLevel] = useState("");
  const [pushTimeInput, setPushTimeInput] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/users/${userId}?lang=${lang}`);
      if (!res.ok) throw new Error("ユーザーの取得に失敗しました");
      const data = await res.json();
      setUser(data.user);
      setWeeklyReports(data.weeklyReports ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }, [userId, lang]);

  const fetchChatLogs = useCallback(
    async (pageNum: number, append: boolean = false) => {
      setChatLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("lang", lang);
        params.set("page", String(pageNum));
        params.set("limit", "20");
        if (chatTypeFilter !== "all") {
          params.set("type", chatTypeFilter);
        }
        const res = await fetch(
          `/api/users/${userId}/chat-logs?${params.toString()}`
        );
        if (!res.ok) throw new Error("チャットログの取得に失敗しました");
        const data = await res.json();
        const logs: ChatLog[] = data.chatLogs ?? [];
        if (append) {
          setChatLogs((prev) => [...prev, ...logs]);
        } else {
          setChatLogs(logs);
        }
        setChatHasMore(logs.length === 20);
      } catch (err) {
        console.error("Error fetching chat logs:", err);
      } finally {
        setChatLoading(false);
      }
    },
    [userId, lang, chatTypeFilter]
  );

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (user?.pushTime) {
      setPushTimeInput(user.pushTime);
    }
  }, [user?.pushTime]);

  useEffect(() => {
    setChatPage(1);
    fetchChatLogs(1, false);
  }, [fetchChatLogs]);

  const handleLoadMore = () => {
    const nextPage = chatPage + 1;
    setChatPage(nextPage);
    fetchChatLogs(nextPage, true);
  };

  const toggleReport = (index: number) => {
    setExpandedReports((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleLevelChange = async () => {
    if (!newLevel || !user) return;
    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/users/${userId}/level`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level: newLevel, lang }),
      });
      if (!res.ok) throw new Error("レベル変更に失敗しました");
      setActionMessage({ type: "success", text: "レベルを変更しました" });
      fetchUser();
    } catch (err) {
      setActionMessage({
        type: "error",
        text: err instanceof Error ? err.message : "エラーが発生しました",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!user) return;
    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/users/${userId}/active`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive, lang }),
      });
      if (!res.ok) throw new Error("通知設定の変更に失敗しました");
      setActionMessage({ type: "success", text: "通知設定を変更しました" });
      fetchUser();
    } catch (err) {
      setActionMessage({
        type: "error",
        text: err instanceof Error ? err.message : "エラーが発生しました",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePushTimeChange = async (newTime: string) => {
    if (!user) return;
    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/users/${userId}/push-time`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pushTime: newTime, lang }),
      });
      if (!res.ok) throw new Error("通知時間の変更に失敗しました");
      setActionMessage({ type: "success", text: "通知時間を変更しました" });
      fetchUser();
    } catch (err) {
      setActionMessage({
        type: "error",
        text: err instanceof Error ? err.message : "エラーが発生しました",
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">{error || "ユーザーが見つかりません"}</p>
      </div>
    );
  }

  const last7Days = getLast7Days();

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{user.displayName}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant="outline">{user.language?.toUpperCase() ?? "N/A"}</Badge>
            <Badge variant={user.plan === "bot_pro" ? "default" : "secondary"}>
              {user.plan === "bot_pro" ? "Bot Pro" : "Free"}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {user.englishLevel}
            </Badge>
          </div>
        </div>
        <HealthScoreBadge score={user.healthScore} size="lg" />
      </div>

      <Separator />

      {/* Tabs */}
      <Tabs defaultValue="summary">
        <TabsList>
          <TabsTrigger value="summary">サマリー</TabsTrigger>
          <TabsTrigger value="chats">チャット履歴</TabsTrigger>
          <TabsTrigger value="reports">週次レポート</TabsTrigger>
          <TabsTrigger value="actions">管理アクション</TabsTrigger>
        </TabsList>

        {/* Tab 1: Summary */}
        <TabsContent value="summary" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Onboarding */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">オンボーディング</CardTitle>
              </CardHeader>
              <CardContent>
                <OnboardingProgress status={user.onboardingStatus} />
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">学習統計</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">現在のストリーク</p>
                    <p className="text-2xl font-bold">{user.currentStreak}日</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">最長ストリーク</p>
                    <p className="text-2xl font-bold">{user.longestStreak}日</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">テキストチャット</p>
                    <p className="text-2xl font-bold">{user.totalChats}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">音声チャット</p>
                    <p className="text-2xl font-bold">{user.totalVoice}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Level history */}
          {user.levelHistory && user.levelHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">レベル履歴</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {user.levelHistory.map((entry, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <div className="flex-1">
                        <span className="font-medium capitalize">
                          {entry.level}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(entry.changedAt)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Last 7 days activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">直近7日間のアクティビティ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {last7Days.map((day) => {
                  // Estimate active days based on streak and lastActiveDate
                  const dayActive = day <= user.lastActiveDate && day >= getLast7DayStart(user.lastActiveDate, user.currentStreak);
                  return (
                    <div key={day} className="flex flex-col items-center gap-1">
                      <div
                        className={`w-8 h-8 rounded-md border-2 ${
                          dayActive
                            ? "bg-primary border-primary"
                            : "bg-muted border-muted-foreground/20"
                        }`}
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(day).toLocaleDateString("ja-JP", {
                          month: "numeric",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Chat History */}
        <TabsContent value="chats" className="space-y-4">
          <div className="flex items-center gap-3">
            <Label>タイプ:</Label>
            <Select
              value={chatTypeFilter}
              onValueChange={(v) =>
                setChatTypeFilter(v as "all" | "text" | "voice")
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全て</SelectItem>
                <SelectItem value="text">テキスト</SelectItem>
                <SelectItem value="voice">音声</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4 max-w-3xl">
            {chatLogs.length === 0 && !chatLoading ? (
              <p className="text-center text-muted-foreground py-8">
                チャット履歴がありません
              </p>
            ) : (
              chatLogs.map((log, i) => (
                <div key={i} className="space-y-2">
                  <div className="text-xs text-center text-muted-foreground">
                    {formatTimestamp(log.createdAt)}
                    {log.type === "voice" && (
                      <Badge variant="outline" className="ml-2 text-[10px]">
                        音声
                      </Badge>
                    )}
                  </div>
                  {/* User message - right aligned */}
                  <div className="flex justify-end">
                    <div className="bg-blue-500 text-white rounded-2xl rounded-br-sm px-4 py-2 max-w-[75%]">
                      <p className="text-sm whitespace-pre-wrap">
                        {log.userMessage}
                      </p>
                    </div>
                  </div>
                  {/* AI response - left aligned */}
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-2 max-w-[75%]">
                      <p className="text-sm whitespace-pre-wrap">
                        {log.aiResponse}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}

            {chatLoading && (
              <p className="text-center text-muted-foreground py-4">
                読み込み中...
              </p>
            )}

            {chatHasMore && !chatLoading && chatLogs.length > 0 && (
              <div className="flex justify-center">
                <Button variant="outline" onClick={handleLoadMore}>
                  もっと読み込む
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 3: Weekly Reports */}
        <TabsContent value="reports" className="space-y-3">
          {weeklyReports.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              週次レポートがありません
            </p>
          ) : (
            weeklyReports.map((report, i) => (
              <Card key={i}>
                <CardHeader
                  className="cursor-pointer"
                  onClick={() => toggleReport(i)}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {report.weekStart} の週
                    </CardTitle>
                    <div className="flex items-center gap-4">
                      <div className="flex gap-3 text-sm text-muted-foreground">
                        <span>テキスト: {report.textCount}</span>
                        <span>音声: {report.voiceCount}</span>
                        <span>アクティブ日数: {report.activeDays}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {expandedReports.has(i) ? "\u25B2" : "\u25BC"}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                {expandedReports.has(i) && (
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">
                      {report.reportText}
                    </p>
                    <p className="text-xs text-muted-foreground mt-3">
                      送信日: {formatTimestamp(report.sentAt)}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </TabsContent>

        {/* Tab 4: Admin Actions */}
        <TabsContent value="actions" className="space-y-6">
          {actionMessage && (
            <div
              className={`p-3 rounded-md text-sm ${
                actionMessage.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {actionMessage.text}
            </div>
          )}

          {/* Plan change */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">プラン変更</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">現在のプラン</p>
                  <Badge
                    variant={user.plan === "bot_pro" ? "default" : "secondary"}
                    className="mt-1"
                  >
                    {user.plan === "bot_pro" ? "Bot Pro" : "Free"}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setPlanDialogOpen(true)}
                >
                  プランを変更
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Level change */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">レベル変更</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">現在のレベル</p>
                  <p className="font-medium capitalize mt-1">
                    {user.englishLevel}
                  </p>
                </div>
                <Select value={newLevel} onValueChange={setNewLevel}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="新しいレベル" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  disabled={!newLevel || newLevel === user.englishLevel || actionLoading}
                  onClick={handleLevelChange}
                >
                  {actionLoading ? "変更中..." : "変更する"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notification toggle */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">通知設定</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">通知ステータス</p>
                  <Badge
                    variant={user.isActive ? "default" : "secondary"}
                    className="mt-1"
                  >
                    {user.isActive ? "有効" : "無効"}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  disabled={actionLoading}
                  onClick={handleToggleActive}
                >
                  {user.isActive ? "通知を無効にする" : "通知を有効にする"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Push time change */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">通知時間変更</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">現在の通知時間</p>
                  <p className="font-medium mt-1">{user.pushTime || "未設定"}</p>
                </div>
                <Input
                  type="time"
                  className="w-32"
                  value={pushTimeInput}
                  onChange={(e) => setPushTimeInput(e.target.value)}
                  onBlur={(e) => {
                    if (e.target.value && e.target.value !== user.pushTime) {
                      handlePushTimeChange(e.target.value);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const target = e.target as HTMLInputElement;
                      if (target.value && target.value !== user.pushTime) {
                        handlePushTimeChange(target.value);
                      }
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Plan change dialog */}
      <PlanChangeDialog
        userId={userId}
        currentPlan={user.plan}
        lang={lang}
        onSuccess={fetchUser}
        open={planDialogOpen}
        onOpenChange={setPlanDialogOpen}
      />
    </div>
  );
}

// Helper: estimate which of the last 7 days were active based on streak and lastActiveDate
function getLast7DayStart(lastActiveDate: string, currentStreak: number): string {
  const lastActive = new Date(lastActiveDate);
  const streakStart = new Date(lastActive);
  streakStart.setDate(streakStart.getDate() - currentStreak + 1);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  // Return the later of the two dates
  const start = streakStart > sevenDaysAgo ? streakStart : sevenDaysAgo;
  return start.toISOString().split("T")[0];
}
