import { TargetLanguage } from "../config/languages";

export function buildReportPrompt(
  data: {
    displayName: string;
    textCount: number;
    voiceCount: number;
    activeDays: number;
    currentStreak: number;
    topTopics: string;
  },
  lang: TargetLanguage = "en"
): string {
  const langLabel = lang === "es" ? "スペイン語" : "英語";
  return `以下のユーザーの週次${langLabel}学習データをもとに、励ましと次週のアドバイスを日本語で書いてください。
3文以内、100文字以内で簡潔に。

- ユーザー名: ${data.displayName}
- テキストチャット: ${data.textCount}回
- ボイスチャット: ${data.voiceCount}回
- アクティブ日数: ${data.activeDays}日
- 連続学習: ${data.currentStreak}日
- よく話したトピック: ${data.topTopics}`;
}
