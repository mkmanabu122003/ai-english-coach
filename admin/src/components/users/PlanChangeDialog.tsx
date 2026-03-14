"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PlanChangeDialogProps {
  userId: string;
  currentPlan: string;
  lang: string;
  onSuccess: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlanChangeDialog({
  userId,
  currentPlan,
  lang,
  onSuccess,
  open,
  onOpenChange,
}: PlanChangeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const newPlan = currentPlan === "free" ? "bot_pro" : "free";

  const planLabel = (plan: string) => {
    return plan === "free" ? "Free" : "Bot Pro";
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/users/${userId}/plan`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: newPlan, lang }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "プラン変更に失敗しました");
      }
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>プラン変更</DialogTitle>
          <DialogDescription>
            ユーザーのプランを変更します。この操作は即座に反映されます。
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center gap-4 py-6">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">現在のプラン</p>
            <Badge variant="outline" className="text-base px-4 py-1">
              {planLabel(currentPlan)}
            </Badge>
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5 text-muted-foreground"
          >
            <path
              fillRule="evenodd"
              d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">新しいプラン</p>
            <Badge className="text-base px-4 py-1">
              {planLabel(newPlan)}
            </Badge>
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            キャンセル
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? "変更中..." : "変更する"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
