/**
 * Guide Badge system — gamification for レベル確認 command.
 * Calculates user's badge/title based on total chats and streak,
 * and builds a LINE Flex Message for the enhanced level check.
 */

import { User } from "../types";

// ── Badge Definitions ──

export interface GuideBadge {
  icon: string;
  title: string;
  minChats: number;
  minStreak: number;
}

const BADGES: GuideBadge[] = [
  { icon: "🔰", title: "研修生", minChats: 0, minStreak: 0 },
  { icon: "🥉", title: "見習いガイド", minChats: 10, minStreak: 0 },
  { icon: "🥈", title: "一人前ガイド", minChats: 30, minStreak: 0 },
  { icon: "🥇", title: "ベテランガイド", minChats: 50, minStreak: 7 },
  { icon: "👑", title: "マスターガイド", minChats: 100, minStreak: 14 },
  { icon: "🏅", title: "レジェンドガイド", minChats: 200, minStreak: 30 },
];

export interface BadgeInfo {
  current: GuideBadge;
  next: GuideBadge | null;
  progress: number; // 0-100
  remaining: number; // chats remaining to next badge
}

export function getGuideBadge(totalChats: number, currentStreak: number): BadgeInfo {
  let currentIdx = 0;
  for (let i = BADGES.length - 1; i >= 0; i--) {
    if (totalChats >= BADGES[i].minChats && currentStreak >= BADGES[i].minStreak) {
      currentIdx = i;
      break;
    }
  }

  const current = BADGES[currentIdx];
  const next = currentIdx < BADGES.length - 1 ? BADGES[currentIdx + 1] : null;

  let progress = 100;
  let remaining = 0;
  if (next) {
    const chatRange = next.minChats - current.minChats;
    const chatProgress = totalChats - current.minChats;
    progress = chatRange > 0 ? Math.min(Math.floor((chatProgress / chatRange) * 100), 99) : 0;
    remaining = Math.max(next.minChats - totalChats, 0);
  }

  return { current, next, progress, remaining };
}

// ── Weekly Calendar ──

const DAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"];

export function buildWeekCalendar(activeDates: Set<string>, todayJST: string): string {
  // Get Monday of current week
  const today = new Date(todayJST + "T00:00:00Z");
  const dayOfWeek = today.getUTCDay(); // 0=Sun, 1=Mon, ...
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today.getTime() + mondayOffset * 86400000);

  const squares: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday.getTime() + i * 86400000);
    const dateStr = d.toISOString().slice(0, 10);
    if (dateStr > todayJST) {
      squares.push("⬜");
    } else {
      squares.push(activeDates.has(dateStr) ? "🟩" : "⬜");
    }
  }

  return `${squares.join("")}\n${DAY_LABELS.map((l) => ` ${l} `).join("")}`;
}

// ── Progress Bar ──

function buildProgressBar(percent: number): string {
  const filled = Math.round(percent / 6.67); // 15 blocks total
  const empty = 15 - filled;
  return "█".repeat(filled) + "░".repeat(empty) + ` ${percent}%`;
}

// ── Flex Message Builder ──

export function buildLevelCheckFlexMessage(
  user: User,
  activeDates: Set<string>,
  todayJST: string
): Record<string, unknown> {
  const badge = getGuideBadge(user.totalChats, user.currentStreak);
  const levelDisplay = user.englishLevel === "unset" ? "未判定" : capitalize(user.englishLevel);
  const calendar = buildWeekCalendar(activeDates, todayJST);

  // Build progress section
  let progressText: string;
  if (badge.next) {
    progressText = `${buildProgressBar(badge.progress)}\n次の称号「${badge.next.icon} ${badge.next.title}」まであと${badge.remaining}回`;
    if (badge.next.minStreak > 0 && user.currentStreak < badge.next.minStreak) {
      progressText += `（+ ${badge.next.minStreak}日連続）`;
    }
  } else {
    progressText = `${buildProgressBar(100)}\n最高ランク達成！`;
  }

  // Flex Message JSON
  return {
    type: "flex",
    altText: `${badge.current.icon} ${badge.current.title} | Lv. ${levelDisplay}`,
    contents: {
      type: "bubble",
      size: "mega",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          // Title row: badge icon + title
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: badge.current.icon,
                size: "3xl",
                flex: 0,
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: badge.current.title,
                    weight: "bold",
                    size: "xl",
                  },
                  {
                    type: "text",
                    text: `Lv. ${levelDisplay}`,
                    size: "sm",
                    color: "#888888",
                  },
                ],
                paddingStart: "lg",
              },
            ],
            alignItems: "center",
          },
          // Separator
          { type: "separator", margin: "lg" },
          // Stats
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            contents: [
              buildStatRow("🔥", "連続学習", `${user.currentStreak}日`),
              buildStatRow("📚", "累計チャット", `${user.totalChats}回`),
              buildStatRow("🏆", "最長ストリーク", `${user.longestStreak}日`),
              buildStatRow("🎤", "音声練習", `${user.totalVoice}回`),
            ],
          },
          // Separator
          { type: "separator", margin: "lg" },
          // Progress bar
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            contents: [
              {
                type: "text",
                text: "次の称号への進捗",
                size: "xs",
                color: "#888888",
              },
              {
                type: "text",
                text: progressText,
                size: "sm",
                wrap: true,
                margin: "sm",
              },
            ],
          },
          // Separator
          { type: "separator", margin: "lg" },
          // Weekly calendar
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            contents: [
              {
                type: "text",
                text: "今週の学習",
                size: "xs",
                color: "#888888",
              },
              {
                type: "text",
                text: calendar,
                size: "sm",
                margin: "sm",
              },
            ],
          },
        ],
      },
      styles: {
        body: {
          backgroundColor: "#FAFAFA",
        },
      },
    },
  };
}

function buildStatRow(icon: string, label: string, value: string): Record<string, unknown> {
  return {
    type: "box",
    layout: "horizontal",
    contents: [
      {
        type: "text",
        text: `${icon} ${label}`,
        size: "sm",
        color: "#555555",
        flex: 4,
      },
      {
        type: "text",
        text: value,
        size: "sm",
        color: "#111111",
        align: "end",
        flex: 2,
        weight: "bold",
      },
    ],
    margin: "sm",
  };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
