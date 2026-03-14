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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Question {
  id: string;
  category: string;
  level: string;
  question: string;
  language: string;
  isActive: boolean;
}

interface QuestionFormData {
  category: string;
  level: string;
  question: string;
}

const CATEGORIES_EN = [
  "shrine_temple",
  "food",
  "daily_life",
  "concept",
  "practical",
  "nature",
];

const CATEGORIES_ES = [
  "greetings_basics",
  "travel",
  "culture",
  "food",
  "daily_life",
  "grammar_practice",
];

const LEVELS = ["beginner", "intermediate", "advanced"];

const CATEGORY_LABELS: Record<string, string> = {
  shrine_temple: "神社仏閣",
  food: "食文化",
  daily_life: "日常生活",
  concept: "日本の概念",
  practical: "実践",
  nature: "自然",
  greetings_basics: "挨拶・基礎",
  travel: "旅行",
  culture: "文化",
  grammar_practice: "文法練習",
};

const LEVEL_LABELS: Record<string, string> = {
  beginner: "初級",
  intermediate: "中級",
  advanced: "上級",
};

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<"en" | "es">("en");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterLevel, setFilterLevel] = useState<string>("all");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [formData, setFormData] = useState<QuestionFormData>({
    category: "",
    level: "",
    question: "",
  });
  const [saving, setSaving] = useState(false);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingQuestion, setDeletingQuestion] = useState<Question | null>(null);
  const [deleting, setDeleting] = useState(false);

  const categories = lang === "es" ? CATEGORIES_ES : CATEGORIES_EN;

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ lang });
      if (filterCategory !== "all") params.set("category", filterCategory);
      if (filterLevel !== "all") params.set("level", filterLevel);

      const res = await fetch(`/api/content/questions?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch questions");
      const data = await res.json();
      setQuestions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching questions:", err);
    } finally {
      setLoading(false);
    }
  }, [lang, filterCategory, filterLevel]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Reset category filter when language changes
  useEffect(() => {
    setFilterCategory("all");
  }, [lang]);

  const handleOpenAdd = () => {
    setEditingQuestion(null);
    setFormData({ category: categories[0], level: "beginner", question: "" });
    setDialogOpen(true);
  };

  const handleOpenEdit = (q: Question) => {
    setEditingQuestion(q);
    setFormData({
      category: q.category,
      level: q.level,
      question: q.question,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.category || !formData.level || !formData.question.trim()) return;
    setSaving(true);

    try {
      if (editingQuestion) {
        // Update
        const res = await fetch("/api/content/questions", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingQuestion.id,
            category: formData.category,
            level: formData.level,
            question: formData.question.trim(),
            language: lang,
          }),
        });
        if (!res.ok) throw new Error("Failed to update question");
      } else {
        // Create
        const res = await fetch("/api/content/questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: formData.category,
            level: formData.level,
            question: formData.question.trim(),
            language: lang,
          }),
        });
        if (!res.ok) throw new Error("Failed to create question");
      }

      setDialogOpen(false);
      fetchQuestions();
    } catch (err) {
      console.error("Error saving question:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingQuestion) return;
    setDeleting(true);

    try {
      const res = await fetch("/api/content/questions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deletingQuestion.id }),
      });
      if (!res.ok) throw new Error("Failed to delete question");

      setDeleteDialogOpen(false);
      setDeletingQuestion(null);
      fetchQuestions();
    } catch (err) {
      console.error("Error deleting question:", err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">質問管理</h1>
          <p className="text-sm text-muted-foreground">
            デイリープッシュで送信する質問を管理します
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
          <Button onClick={handleOpenAdd}>
            <Plus className="h-4 w-4 mr-2" />
            質問を追加
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="w-48">
          <Select
            value={filterCategory}
            onValueChange={setFilterCategory}
          >
            <SelectTrigger>
              <SelectValue placeholder="カテゴリ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全カテゴリ</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {CATEGORY_LABELS[cat] || cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-40">
          <Select
            value={filterLevel}
            onValueChange={setFilterLevel}
          >
            <SelectTrigger>
              <SelectValue placeholder="レベル" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全レベル</SelectItem>
              {LEVELS.map((lvl) => (
                <SelectItem key={lvl} value={lvl}>
                  {LEVEL_LABELS[lvl]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">ID</TableHead>
              <TableHead className="w-32">カテゴリ</TableHead>
              <TableHead className="w-24">レベル</TableHead>
              <TableHead>質問テキスト</TableHead>
              <TableHead className="w-20">有効</TableHead>
              <TableHead className="w-24">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  読み込み中...
                </TableCell>
              </TableRow>
            ) : questions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  質問が見つかりません
                </TableCell>
              </TableRow>
            ) : (
              questions.map((q) => (
                <TableRow key={q.id} className={!q.isActive ? "opacity-50" : ""}>
                  <TableCell className="font-mono text-xs">
                    {q.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {CATEGORY_LABELS[q.category] || q.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        q.level === "advanced"
                          ? "default"
                          : q.level === "intermediate"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {LEVEL_LABELS[q.level] || q.level}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-md truncate">
                    {q.question}
                  </TableCell>
                  <TableCell>
                    <Badge variant={q.isActive ? "default" : "secondary"}>
                      {q.isActive ? "有効" : "無効"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(q)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDeletingQuestion(q);
                          setDeleteDialogOpen(true);
                        }}
                        disabled={!q.isActive}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-sm text-muted-foreground">
        全 {questions.length} 件
      </p>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? "質問を編集" : "質問を追加"}
            </DialogTitle>
            <DialogDescription>
              {editingQuestion
                ? "質問の内容を編集します"
                : "新しい質問を追加します"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>カテゴリ</Label>
              <Select
                value={formData.category}
                onValueChange={(v) =>
                  setFormData((prev) => ({ ...prev, category: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {CATEGORY_LABELS[cat] || cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>レベル</Label>
              <Select
                value={formData.level}
                onValueChange={(v) =>
                  setFormData((prev) => ({ ...prev, level: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map((lvl) => (
                    <SelectItem key={lvl} value={lvl}>
                      {LEVEL_LABELS[lvl]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>質問テキスト</Label>
              <textarea
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="質問文を入力..."
                value={formData.question}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, question: e.target.value }))
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
              disabled={saving || !formData.question.trim()}
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
            <DialogTitle>質問を削除しますか？</DialogTitle>
            <DialogDescription>
              この質問を無効化します（ソフトデリート）。データは残りますが、デイリープッシュでは使用されなくなります。
            </DialogDescription>
          </DialogHeader>
          {deletingQuestion && (
            <div className="rounded-md bg-muted p-3 text-sm">
              {deletingQuestion.question}
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
