"use client";

import type { OnboardingStatus } from "@/types";
import { cn } from "@/lib/utils";

interface OnboardingProgressProps {
  status: OnboardingStatus;
}

const steps: { key: keyof OnboardingStatus; label: string }[] = [
  { key: "firstText", label: "初回テキスト" },
  { key: "levelSet", label: "レベル判定" },
  { key: "pushTimeSet", label: "通知時間設定" },
  { key: "firstVoice", label: "初回音声" },
  { key: "streak3", label: "3日連続" },
];

export function OnboardingProgress({ status }: OnboardingProgressProps) {
  const completedCount = steps.filter((s) => status[s.key]).length;
  const progressPercent = (completedCount / steps.length) * 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">オンボーディング進捗</span>
        <span className="text-sm text-muted-foreground">
          {completedCount}/{steps.length}
        </span>
      </div>

      <div className="w-full bg-muted rounded-full h-2.5">
        <div
          className="bg-primary rounded-full h-2.5 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <ul className="space-y-2">
        {steps.map((step) => {
          const completed = status[step.key];
          return (
            <li key={step.key} className="flex items-center gap-2">
              <span
                className={cn(
                  "flex items-center justify-center w-5 h-5 rounded-full text-xs",
                  completed
                    ? "bg-green-100 text-green-600"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {completed ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-3.5 h-3.5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/40" />
                )}
              </span>
              <span
                className={cn(
                  "text-sm",
                  completed ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
