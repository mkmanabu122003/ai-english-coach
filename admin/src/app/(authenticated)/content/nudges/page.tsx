"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface NudgeMessage {
  id: string;
  type: string;
  text: string;
  language: string;
  isActive: boolean;
}

interface NudgeFormData {
  type: string;
  text: string;
}

const NUDGE_TYPES = ["gentle_nudge", "strong_nudge", "streak_boost"] as const;

const NUDGE_TYPE_LABELS: Record<string, string> = {
  gentle_nudge: "やさしいナッジ",
  strong_nudge: "強めのナッジ",
  streak_boost: "ストリークブースト",
};

const NUDGE_TYPE_DESCRIPTIONS: Record<string, string> = {
  gentle_nudge: "1-2日未学習のユーザーに送信",
  strong_nudge: "3日以上未学習のユーザーに送信",
  streak_boost: "連続学習中のユーザーに送信",
};

export default function NudgesPage() {
  const [nudges, setNudges] = useState<NudgeMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<"en" | "es">("en");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNudge, setEditingNudge] = useState<NudgeMessage | null>(null);
  const [formData, setFormData] = useState<NudgeFormData>({
    type: "gentle_nudge",
    text: "",
  });
  const [saving, setSaving] = useState(false);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingNudge, setDeletingNudge] = useState<NudgeMessage | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchNudges = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/content/nudges?lang=${lang}`);
      if (!res.ok) throw new Error("Failed to fetch nudges");
      const data = await res.json();
      setNudges(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching nudges:", err);
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    fetchNudges();
  }, [fetchNudges]);

  const handleOpenAdd = (type: string) => {
    setEditingNudge(null);
    setFormData({ type, text: "" });
    setDialogOpen(true);
  };

  const handleOpenEdit = (nudge: NudgeMessage) => {
    setEditingNudge(nudge);
    setFormData({ type: nudge.type, text: nudge.text });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.type || !formData.text.trim()) return;
    setSaving(true);

    try {
      if (editingNudge) {
        const res = await fetch("/api/content/nudges", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingNudge.id,
            type: formData.type,
            text: formData.text.trim(),
            language: lang,
          }),
        });
        if (!res.ok) throw new Error("Failed to update nudge");
      } else {
        const res = await fetch("/api/content/nudges", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: formData.type,
            text: formData.text.trim(),
            language: lang,
          }),
        });
        if (!res.ok) throw new Error("Failed to create nudge");
      }

      setDialogOpen(false);
      fetchNudges();
    } catch (err) {
      console.error("Error saving nudge:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingNudge) return;
    setDeleting(true);

    try {
      const res = await fetch("/api/content/nudges", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deletingNudge.id }),
      });
      if (!res.ok) throw new Error("Failed to delete nudge");

      setDeleteDialogOpen(false);
      setDeletingNudge(null);
      fetchNudges();
    } catch (err) {
      console.error("Error deleting nudge:", err);
    } finally {
      setDeleting(false);
    }
  };

  // Group nudges by type
  const groupedNudges = NUDGE_TYPES.reduce(
    (acc, type) => {
      acc[type] = nudges.filter((n) => n.type === type);
      return acc;
    },
    {} as Record<string, NudgeMessage[]>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ナッジメッセージ管理</h1>
          <p className="text-sm text-muted-foreground">
            デイリープッシュで使用するナッジメッセージを管理します
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

      {/* Nudge groups */}
      {NUDGE_TYPES.map((type) => (
        <Card key={type}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">
                {NUDGE_TYPE_LABELS[type]}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {NUDGE_TYPE_DESCRIPTIONS[type]}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenAdd(type)}
            >
              <Plus className="h-4 w-4 mr-1" />
              追加
            </Button>
          </CardHeader>
          <CardContent>
            {groupedNudges[type].length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                メッセージがありません
              </p>
            ) : (
              <div className="space-y-2">
                {groupedNudges[type].map((nudge) => (
                  <div
                    key={nudge.id}
                    className={`flex items-center justify-between rounded-md border p-3 ${
                      !nudge.isActive ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex-1 mr-4">
                      <p className="text-sm">{nudge.text}</p>
                      {!nudge.isActive && (
                        <Badge variant="secondary" className="mt-1">
                          無効
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(nudge)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDeletingNudge(nudge);
                          setDeleteDialogOpen(true);
                        }}
                        disabled={!nudge.isActive}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingNudge ? "メッセージを編集" : "メッセージを追加"}
            </DialogTitle>
            <DialogDescription>
              {editingNudge
                ? "ナッジメッセージを編集します"
                : "新しいナッジメッセージを追加します"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>タイプ</Label>
              <Select
                value={formData.type}
                onValueChange={(v) =>
                  setFormData((prev) => ({ ...prev, type: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NUDGE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {NUDGE_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>メッセージテキスト</Label>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="ナッジメッセージを入力..."
                value={formData.text}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, text: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              キャンセル
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !formData.text.trim()}
            >
              {saving ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>メッセージを削除しますか？</DialogTitle>
            <DialogDescription>
              このメッセージを無効化します（ソフトデリート）。
            </DialogDescription>
          </DialogHeader>
          {deletingNudge && (
            <div className="rounded-md bg-muted p-3 text-sm">
              {deletingNudge.text}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "削除中..." : "削除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
