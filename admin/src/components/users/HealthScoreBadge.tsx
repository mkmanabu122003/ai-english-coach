"use client";

import { cn } from "@/lib/utils";

interface HealthScoreBadgeProps {
  score: number;
  size?: "sm" | "lg";
}

export function HealthScoreBadge({ score, size = "sm" }: HealthScoreBadgeProps) {
  const getColor = (score: number) => {
    if (score >= 70) return "bg-green-100 text-green-800 border-green-200";
    if (score >= 30) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full border font-semibold",
        getColor(score),
        size === "lg"
          ? "px-4 py-2 text-lg min-w-[3.5rem]"
          : "px-2.5 py-0.5 text-xs min-w-[2.5rem]"
      )}
    >
      {score}
    </span>
  );
}
