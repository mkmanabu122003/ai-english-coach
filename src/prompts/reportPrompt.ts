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

export function buildReportWithLearningsPrompt(
  data: {
    displayName: string;
    textCount: number;
    voiceCount: number;
    activeDays: number;
    currentStreak: number;
    topTopics: string;
    corrections: string;
  },
  lang: TargetLanguage = "en"
): string {
  const langLabel = lang === "es" ? "スペイン語" : "英語";
  return `以下のユーザーの週次${langLabel}学習データと添削履歴をもとに、2つのセクションを日本語で出力してください。

## セクション1: 励ましコメント
- 3文以内、100文字以内で簡潔に
- 学習データをもとに励ましと次週のアドバイス

## セクション2: 今週の学びTOP3
- 添削履歴から最も重要・頻出の修正ポイントを3つ抽出
- 各ポイントは「番号. カテゴリ — 簡潔な説明」の形式（各30文字以内）
- 添削履歴がない場合は「添削データなし」とだけ書く

必ず以下のフォーマットで出力してください:
---COMMENT---
（励ましコメント）
---LEARNINGS---
1. （学び1）
2. （学び2）
3. （学び3）

## 学習データ
- ユーザー名: ${data.displayName}
- テキストチャット: ${data.textCount}回
- ボイスチャット: ${data.voiceCount}回
- アクティブ日数: ${data.activeDays}日
- 連続学習: ${data.currentStreak}日
- よく話したトピック: ${data.topTopics}

## 今週の添削履歴（AI応答の抜粋）
${data.corrections}`;
}
