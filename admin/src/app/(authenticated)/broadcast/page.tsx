"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Send, Eye, AlertTriangle } from "lucide-react";

interface BroadcastFilters {
  lang: string;
  plan: string;
  level: string;
  healthMin: string;
  healthMax: string;
  lastActiveDaysAgo: string;
  onboardingComplete: string;
}

interface BroadcastHistory {
  id: string;
  adminUserId: string;
  action: string;
  details: {
    message?: string;
    targetCount?: number;
    sentCount?: number;
    lang?: string;
    filters?: Record<string, unknown>;
  };
  createdAt: { _seconds: number; _nanoseconds: number };
}

export default function BroadcastPage() {
  const [filters, setFilters] = useState<BroadcastFilters>({
    lang: "en",
    plan: "",
    level: "",
    healthMin: "",
    healthMax: "",
    lastActiveDaysAgo: "",
    onboardingComplete: "",
  });
  const [message, setMessage] = useState("");
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    success: boolean;
    sent?: number;
    error?: string;
  } | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [history, setHistory] = useState<BroadcastHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/users?preset=churnRisk&limit=1");
      if (res.ok) {
        // Fetch broadcast history from admin actions API
        const actionsRes = await fetch(`/api/users/broadcast-history?limit=20`);
        if (actionsRes.ok) {
          const data = await actionsRes.json();
          setHistory(Array.isArray(data) ? data : data.actions ?? []);
        }
      }
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const buildFilterBody = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const f: Record<string, any> = { lang: filters.lang };
    if (filters.plan) f.plan = filters.plan;
    if (filters.level) f.level = filters.level;
    if (filters.healthMin) f.healthMin = parseFloat(filters.healthMin);
    if (filters.healthMax) f.healthMax = parseFloat(filters.healthMax);
    if (filters.lastActiveDaysAgo)
      f.lastActiveDaysAgo = parseInt(filters.lastActiveDaysAgo, 10);
    if (filters.onboardingComplete === "true") f.onboardingComplete = true;
    if (filters.onboardingComplete === "false") f.onboardingComplete = false;
    return f;
  };

  const handlePreview = async () => {
    setPreviewing(true);
    setSendResult(null);
    try {
      const res = await fetch("/api/broadcast/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filters: buildFilterBody() }),
      });
      if (!res.ok) throw new Error("Failed to preview");
      const data = await res.json();
      setPreviewCount(data.count ?? 0);
    } catch (err) {
      console.error("Error previewing:", err);
    } finally {
      setPreviewing(false);
    }
  };

  const handleSend = async () => {
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch("/api/broadcast/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filters: buildFilterBody(),
          message: message.trim(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        setSendResult({
          success: false,
          error: errData.error || "送信に失敗しました",
        });
      } else {
        const data = await res.json();
        setSendResult({ success: true, sent: data.sent });
        setMessage("");
        setPreviewCount(null);
      }
    } catch (err) {
      console.error("Error sending:", err);
      setSendResult({ success: false, error: "送信中にエラーが発生しました" });
    } finally {
      setSending(false);
      setConfirmDialogOpen(false);
    }
  };

  const handleFilterChange = (key: keyof BroadcastFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPreviewCount(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">ブロードキャスト</h1>
        <p className="text-sm text-muted-foreground">
          セグメントを選択してメッセージを一斉送信します
        </p>
      </div>

      {/* Safety warnings */}
      <div className="flex gap-4">
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4" />
          1日3回まで
        </div>
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4" />
          50人以上はadmin権限が必要
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Segment Builder */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">セグメント設定</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>言語</Label>
              <div className="flex items-center gap-1 rounded-lg border p-1">
                <button
                  onClick={() => handleFilterChange("lang", "en")}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    filters.lang === "en"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => handleFilterChange("lang", "es")}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    filters.lang === "es"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  ES
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>プラン</Label>
              <Select
                value={filters.plan || "all"}
                onValueChange={(v) =>
                  handleFilterChange("plan", v === "all" ? "" : v)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全て</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="bot_pro">Bot Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>レベル</Label>
              <Select
                value={filters.level || "all"}
                onValueChange={(v) =>
                  handleFilterChange("level", v === "all" ? "" : v)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全て</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>ヘルススコア (最小)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="0"
                  value={filters.healthMin}
                  onChange={(e) =>
                    handleFilterChange("healthMin", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>ヘルススコア (最大)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="100"
                  value={filters.healthMax}
                  onChange={(e) =>
                    handleFilterChange("healthMax", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>最終アクティブ (N日前以上)</Label>
              <Input
                type="number"
                min={0}
                placeholder="例: 3"
                value={filters.lastActiveDaysAgo}
                onChange={(e) =>
                  handleFilterChange("lastActiveDaysAgo", e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label>オンボーディング</Label>
              <Select
                value={filters.onboardingComplete || "all"}
                onValueChange={(v) =>
                  handleFilterChange("onboardingComplete", v === "all" ? "" : v)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全て</SelectItem>
                  <SelectItem value="true">完了</SelectItem>
                  <SelectItem value="false">未完了</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handlePreview}
              disabled={previewing}
              variant="outline"
              className="w-full"
            >
              <Eye className="h-4 w-4 mr-2" />
              {previewing ? "集計中..." : "プレビュー"}
            </Button>

            {previewCount !== null && (
              <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-center">
                <p className="text-sm text-blue-800">
                  対象ユーザー: <strong>{previewCount}人</strong>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message input */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">メッセージ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>送信メッセージ</Label>
              <textarea
                className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="送信するメッセージを入力..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <Button
              onClick={() => setConfirmDialogOpen(true)}
              disabled={!message.trim() || previewCount === null || previewCount === 0}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              送信
            </Button>

            {sendResult && (
              <div
                className={`rounded-md p-3 text-center ${
                  sendResult.success
                    ? "bg-green-50 border border-green-200 text-green-800"
                    : "bg-red-50 border border-red-200 text-red-800"
                }`}
              >
                <p className="text-sm">
                  {sendResult.success
                    ? `${sendResult.sent}人にメッセージを送信しました`
                    : `エラー: ${sendResult.error}`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Broadcast History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">送信履歴</CardTitle>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              読み込み中...
            </p>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              送信履歴はありません
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日時</TableHead>
                  <TableHead>メッセージ</TableHead>
                  <TableHead>対象</TableHead>
                  <TableHead>送信数</TableHead>
                  <TableHead>言語</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="text-sm">
                      {h.createdAt?._seconds
                        ? new Date(h.createdAt._seconds * 1000).toLocaleString(
                            "ja-JP"
                          )
                        : "-"}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm">
                      {h.details.message || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {h.details.targetCount ?? "-"}人
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">
                        {h.details.sentCount ?? "-"}人
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {(h.details.lang || "en").toUpperCase()}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>メッセージを送信しますか？</DialogTitle>
            <DialogDescription>
              以下の内容で送信します。この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-md bg-muted p-3">
              <p className="text-xs text-muted-foreground mb-1">対象人数</p>
              <p className="text-lg font-bold">{previewCount}人</p>
            </div>
            <div className="rounded-md bg-muted p-3">
              <p className="text-xs text-muted-foreground mb-1">メッセージ</p>
              <p className="text-sm whitespace-pre-wrap">{message}</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
            >
              キャンセル
            </Button>
            <Button onClick={handleSend} disabled={sending}>
              {sending ? "送信中..." : "送信する"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
