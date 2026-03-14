"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { HealthScoreBadge } from "@/components/users/HealthScoreBadge";

type PresetFilter = "churnRisk" | "onboardingIncomplete" | "rateLimitHitters" | "newUsers" | null;
type SortField = "displayName" | "language" | "plan" | "englishLevel" | "healthScore" | "currentStreak" | "lastActiveDate" | "totalChats";
type SortOrder = "asc" | "desc";

interface Filters {
  search: string;
  language: string;
  plan: string;
  level: string;
  healthMin: string;
  healthMax: string;
}

const PAGE_SIZE = 20;

function getOnboardingCount(status: User["onboardingStatus"]): number {
  if (!status) return 0;
  return [
    status.firstText,
    status.levelSet,
    status.pushTimeSet,
    status.firstVoice,
    status.streak3,
  ].filter(Boolean).length;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState<PresetFilter>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    language: "all",
    plan: "all",
    level: "all",
    healthMin: "",
    healthMax: "",
  });
  const [sortField, setSortField] = useState<SortField>("lastActiveDate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(PAGE_SIZE));
      params.set("sort", sortField);
      params.set("order", sortOrder);

      // Use lang parameter for language filtering (maps to API's collection selection)
      if (filters.language !== "all") {
        params.set("lang", filters.language);
      } else {
        params.set("lang", "all");
      }

      if (preset) {
        params.set("preset", preset);
      }
      if (filters.search) {
        params.set("search", filters.search);
      }
      if (filters.plan !== "all") {
        params.set("plan", filters.plan);
      }
      if (filters.level !== "all") {
        params.set("level", filters.level);
      }
      if (filters.healthMin) {
        params.set("healthMin", filters.healthMin);
      }
      if (filters.healthMax) {
        params.set("healthMax", filters.healthMax);
      }

      const res = await fetch(`/api/users?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data.users ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  }, [page, preset, filters, sortField, sortOrder]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handlePreset = (p: PresetFilter) => {
    setPreset(preset === p ? null : p);
    setPage(1);
  };

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const sortIndicator = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? " \u2191" : " \u2193";
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">ユーザー管理</h1>

      {/* Preset filter buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={preset === "churnRisk" ? "default" : "outline"}
          size="sm"
          onClick={() => handlePreset("churnRisk")}
        >
          離脱リスク
        </Button>
        <Button
          variant={preset === "onboardingIncomplete" ? "default" : "outline"}
          size="sm"
          onClick={() => handlePreset("onboardingIncomplete")}
        >
          オンボーディング未完了
        </Button>
        <Button
          variant={preset === "rateLimitHitters" ? "default" : "outline"}
          size="sm"
          onClick={() => handlePreset("rateLimitHitters")}
        >
          Pro転換候補
        </Button>
        <Button
          variant={preset === "newUsers" ? "default" : "outline"}
          size="sm"
          onClick={() => handlePreset("newUsers")}
        >
          新規7日
        </Button>
      </div>

      {/* Collapsible filter panel */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setFiltersOpen(!filtersOpen)}
        >
          フィルタ {filtersOpen ? "\u25B2" : "\u25BC"}
        </Button>

        {filtersOpen && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 p-4 border rounded-lg bg-background">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">名前検索</label>
              <Input
                placeholder="名前で検索..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">言語</label>
              <Select
                value={filters.language}
                onValueChange={(v) => handleFilterChange("language", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全て</SelectItem>
                  <SelectItem value="en">EN</SelectItem>
                  <SelectItem value="es">ES</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">プラン</label>
              <Select
                value={filters.plan}
                onValueChange={(v) => handleFilterChange("plan", v)}
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
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">レベル</label>
              <Select
                value={filters.level}
                onValueChange={(v) => handleFilterChange("level", v)}
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
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">ヘルススコア (最小)</label>
              <Input
                type="number"
                min={0}
                max={100}
                placeholder="0"
                value={filters.healthMin}
                onChange={(e) => handleFilterChange("healthMin", e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">ヘルススコア (最大)</label>
              <Input
                type="number"
                min={0}
                max={100}
                placeholder="100"
                value={filters.healthMax}
                onChange={(e) => handleFilterChange("healthMax", e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Data table */}
      <div className="border rounded-lg bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("displayName")}
              >
                名前{sortIndicator("displayName")}
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("language")}
              >
                言語{sortIndicator("language")}
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("plan")}
              >
                プラン{sortIndicator("plan")}
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("englishLevel")}
              >
                レベル{sortIndicator("englishLevel")}
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("healthScore")}
              >
                ヘルススコア{sortIndicator("healthScore")}
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("currentStreak")}
              >
                ストリーク{sortIndicator("currentStreak")}
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("lastActiveDate")}
              >
                最終学習日{sortIndicator("lastActiveDate")}
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("totalChats")}
              >
                チャット数{sortIndicator("totalChats")}
              </TableHead>
              <TableHead>オンボーディング</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  読み込み中...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  ユーザーが見つかりません
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const onboardingCount = getOnboardingCount(user.onboardingStatus);
                return (
                  <TableRow
                    key={`${user.lineUserId}-${user.language}`}
                    className="cursor-pointer"
                    onClick={() =>
                      router.push(
                        `/users/${user.lineUserId}?lang=${user.language}`
                      )
                    }
                  >
                    <TableCell className="font-medium">
                      {user.displayName}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {user.language?.toUpperCase() ?? "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.plan === "bot_pro" ? "default" : "secondary"
                        }
                      >
                        {user.plan === "bot_pro" ? "Pro" : "Free"}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">
                      {user.englishLevel}
                    </TableCell>
                    <TableCell>
                      <HealthScoreBadge score={user.healthScore} size="sm" />
                    </TableCell>
                    <TableCell>{user.currentStreak}日</TableCell>
                    <TableCell>{user.lastActiveDate || "-"}</TableCell>
                    <TableCell>
                      {user.totalChats + user.totalVoice}
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          onboardingCount === 5
                            ? "text-green-600 font-medium"
                            : "text-muted-foreground"
                        }
                      >
                        {onboardingCount}/5
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          全 {total} 件中 {Math.min((page - 1) * PAGE_SIZE + 1, total)}-
          {Math.min(page * PAGE_SIZE, total)} 件を表示
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            前へ
          </Button>
          <span className="flex items-center text-sm px-2">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            次へ
          </Button>
        </div>
      </div>
    </div>
  );
}
