# 管理画面 要件定義書（v2）

> CTO・CMO・Chief Customer Success の3視点レビューを反映した改訂版

---

## 1. 目的

LINE Botの運用状況を可視化し、**見る → 判断する → 行動する** のサイクルを回せる管理画面を構築する。

単なるデータビューアではなく、**各画面に「次に何をすべきか」が分かるアクション導線**を持たせる。

---

## 2. 想定ユーザーとロール

| ロール | 権限 | 認証方式 |
|---|---|---|
| **admin**（運営者） | 全機能の読み書き | Firebase Auth + Custom Claims `role: "admin"` |
| **instructor**（講師） | 担当ユーザーの閲覧、個別メッセージ送信 | Firebase Auth + Custom Claims `role: "instructor"` |

- Security Rules と API Routes の両方で `role` を検証する
- 全ての管理操作は **監査ログ** に記録する

---

## 3. データ基盤設計（CTO指摘対応）

### 3-1. 日次集計バッチ（P0必須）

ダッシュボードの集計クエリによるFirestore Read課金爆発を防ぐため、**Cloud Functionsで日次集計ドキュメントを生成**する。

**コレクション: `stats/daily/{YYYY-MM-DD}`**

```typescript
{
  // ユーザー数
  totalUsers: { en: number, es: number },
  activeUsers: { en: number, es: number },     // isActive=true
  freeUsers: { en: number, es: number },
  proUsers: { en: number, es: number },

  // 新規・離脱
  newFollows: { en: number, es: number },       // 当日createdAt
  unfollows: { en: number, es: number },        // 当日isActive=falseに変化

  // チャット
  textChats: { en: number, es: number },
  voiceChats: { en: number, es: number },

  // トークン
  promptTokens: { en: number, es: number },
  completionTokens: { en: number, es: number },

  // エンゲージメント
  dau: { en: number, es: number },              // 当日チャットしたユニークユーザー
  avgStreak: { en: number, es: number },

  // ファネル（CMO指摘対応）
  firstChatUsers: { en: number, es: number },   // 当日初チャットしたユーザー
  rateLimitHits: { en: number, es: number },    // 無料上限に到達した回数
  proConversions: { en: number, es: number },   // 当日Free→Proに変更

  generatedAt: Timestamp
}
```

**コレクション: `stats/weekly/{YYYY-Www}`**

```typescript
{
  wau: { en: number, es: number },
  newFollows: { en: number, es: number },
  unfollows: { en: number, es: number },
  proConversions: { en: number, es: number },
  proCancellations: { en: number, es: number },
  avgSessionChats: { en: number, es: number },  // セッションあたり平均チャット数
  voiceAdoptionRate: { en: number, es: number }, // 音声利用Proユーザー / 全Proユーザー

  generatedAt: Timestamp
}
```

### 3-2. 監査ログ（P0必須）

**コレクション: `adminActions`**

```typescript
{
  adminUserId: string,        // 操作した管理者
  action: string,             // "plan_change" | "level_change" | "send_message" | "broadcast" | ...
  targetUserId?: string,      // 対象ユーザー（該当時）
  details: Record<string, any>, // { from: "free", to: "bot_pro" } 等
  createdAt: Timestamp
}
```

### 3-3. ヘルススコア（CS指摘対応）

ユーザードキュメントに以下を追加:

```typescript
// User型に追加
{
  healthScore: number,              // 0-100、日次バッチで算出
  onboardingStatus: {               // オンボーディング進捗
    firstText: boolean,
    levelSet: boolean,
    pushTimeSet: boolean,           // デフォルト08:00から変更済みか
    firstVoice: boolean,
    streak3: boolean,
  },
  levelHistory: Array<{             // レベル遷移の記録
    level: string,
    changedAt: Timestamp,
  }>,
  planHistory: Array<{              // プラン変更履歴
    plan: string,
    changedAt: Timestamp,
  }>,
  interventions: Array<{            // 介入履歴
    type: "auto_nudge" | "admin_message" | "survey",
    content: string,
    sentAt: Timestamp,
    adminUserId?: string,
  }>,
}
```

**ヘルススコア算出ロジック:**

```
ストリーク (30点): min(currentStreak / 7, 1) × 30
週間頻度  (30点): min(過去7日のチャット日数 / 5, 1) × 30
音声利用  (20点): 過去7日に音声1回以上 → 20, なし → 0
レベル進捗 (20点): unset→0, beginner→7, intermediate→14, advanced→20
```

---

## 4. 画面構成と機能要件

### 4-1. ダッシュボード（トップ）

**日次集計ドキュメントを参照**（Firestoreフルスキャンしない）

#### KPIカード（上段）

| 指標 | 表示内容 | データソース |
|---|---|---|
| 総ユーザー数 | EN / ES別、Active / Inactive | `stats/daily` |
| プラン内訳 | Free / Bot Pro の人数・比率 | `stats/daily` |
| 本日チャット数 | テキスト / 音声、前日比 | `stats/daily` |
| DAU / WAU | 日次・週次アクティブ | `stats/daily`, `stats/weekly` |
| 平均ヘルススコア | 全アクティブユーザー平均 | `stats/daily` |
| 離脱リスク数 | ヘルススコア30未満のProユーザー | `stats/daily` |
| 月間トークン消費 | prompt + completion、前月比 | `stats/daily`の月間合算 |

#### ファネルチャート（中段・CMO指摘対応）

```
友だち追加 → 初回チャット → 7日継続 → Pro転換
  100%    →    ??%      →   ??%   →   ??%
```

- 日別・週別・月別で切替可能
- 各段階のドロップ率を表示

#### トレンドグラフ（下段）

- DAU推移（過去30日）
- 新規追加 vs ブロック（Net Growth）
- トークン消費推移

#### アクションパネル（右サイド）

> **「今日やるべきこと」を表示**

- 離脱リスクユーザー上位5名（ヘルススコア順）→ クリックでユーザー詳細へ
- オンボーディング未完了ユーザー数 → クリックで一覧フィルタ
- 無料上限到達回数が多いユーザー → Pro転換候補

---

### 4-2. ユーザー管理

#### ユーザー一覧

| カラム | ソート | フィルタ |
|---|---|---|
| 名前 | ○ | テキスト検索 |
| 言語（EN/ES） | — | ○ |
| プラン | — | ○ |
| レベル | — | ○ |
| ヘルススコア | ○ | 範囲指定 |
| ストリーク | ○ | — |
| 最終学習日 | ○ | 期間指定 |
| 累計チャット数 | ○ | — |
| オンボーディング進捗 | ○ | 完了 / 未完了 |

**プリセットフィルタ（ワンクリック）:**
- 離脱リスク（ヘルススコア < 30 & Pro）
- オンボーディング未完了
- 無料上限頻繁到達（Pro転換候補）
- 直近7日新規ユーザー

#### ユーザー詳細

```
┌─────────────────────────────────────────────────┐
│ [名前]  EN | Bot Pro | Intermediate              │
│ ヘルススコア: 72/100 🟡                           │
├───────────┬─────────────────────────────────────┤
│ サマリー   │ オンボーディング: 4/5（未: 初回音声）    │
│           │ ストリーク: 12日 / 最長: 18日           │
│           │ 累計: テキスト84回 / 音声7回            │
│           │ レベル推移: beginner(1/15)→intermediate(2/28) │
│           │ 直近7日: ■■□■■■□（5/7日）             │
├───────────┼─────────────────────────────────────┤
│ チャット   │ テキスト・音声の全履歴（日付フィルタ）    │
│ 履歴      │ ユーザー発言 / AI応答を対話形式で表示     │
├───────────┼─────────────────────────────────────┤
│ 週次      │ 週次レポートの一覧                      │
│ レポート   │                                      │
├───────────┼─────────────────────────────────────┤
│ 介入履歴   │ 自動ナッジ・管理者メッセージの送信履歴    │
│           │ + 「メッセージ送信」ボタン               │
├───────────┼─────────────────────────────────────┤
│ 管理      │ プラン変更 / レベル変更 / 通知設定変更    │
│ アクション │ ※ 全て監査ログに記録                    │
└───────────┴─────────────────────────────────────┘
```

#### 管理アクション

| アクション | 制約 | 監査ログ |
|---|---|---|
| プラン変更 | Free ↔ Bot Pro | `plan_change: { from, to }` |
| レベル変更 | beginner / intermediate / advanced | `level_change: { from, to }` |
| 通知ON/OFF | isActive切替 | `notification_change` |
| 通知時間変更 | HH:MM形式バリデーション | `push_time_change` |
| 個別メッセージ送信 | 送信前に確認ダイアログ | `send_message: { content }` |

---

### 4-3. セグメント配信（CMO指摘対応）

#### 配信条件

| セグメント条件 | 選択肢 |
|---|---|
| 言語 | EN / ES / 全て |
| プラン | Free / Bot Pro / 全て |
| レベル | beginner / intermediate / advanced / 全て |
| ヘルススコア | 範囲指定（例: 0-30） |
| 最終学習日 | N日以上前 |
| オンボーディング | 完了 / 未完了 |

#### 配信フロー

```
条件設定 → 対象人数プレビュー → メッセージ入力 → 確認画面 → 送信
```

**安全装置（CTO指摘対応）:**
- 送信前に対象人数と本文を確認画面で表示
- 1日あたり一斉配信は **3回まで**
- 対象50人以上の配信は **admin権限必須**
- 全配信履歴を監査ログに記録

---

### 4-4. チャットログ・トークン分析

#### ログ検索

| フィルタ | 内容 |
|---|---|
| 期間 | 日付範囲指定 |
| ユーザー | 名前・ID検索 |
| 種別 | text / voice |
| 言語 | EN / ES |

※ 全文検索はMVPでは対象外。P2以降でBigQuery連携を検討。

#### トークン消費レポート

- 日別・週別・月別のグラフ表示（Recharts）
- prompt / completion の内訳
- ユーザーあたり平均トークン
- データソース: `stats/daily`の集計値

---

### 4-5. コンテンツ管理

> **前提:** P1着手前に問題プールをソースコードからFirestoreコレクション（`questions`, `questionsEs`）に移行する

#### 問題プール管理

| 機能 | 詳細 |
|---|---|
| 一覧 | カテゴリ・レベルでフィルタ、EN 60問 / ES 48問 |
| 追加 | カテゴリ、レベル、質問テキストを入力 |
| 編集 | 既存問題の修正 |
| 削除 | 論理削除（`isActive: false`） |
| プレビュー | 実際にLINEで送信される形式でプレビュー |

#### ナッジメッセージ管理

| 種別 | 現在の数 | 編集対象 |
|---|---|---|
| gentle_nudge | 各2-3パターン | テキスト編集 |
| strong_nudge | 各2-3パターン | テキスト編集 |
| streak_boost | 各2-3パターン | テキスト編集 |

#### プッシュ配信履歴

- いつ・誰に・どの問題を送ったかのログ
- 配信後の応答率（送信→24時間以内にチャット）

---

### 4-6. 売上・課金管理

| 指標 | 計算方法 |
|---|---|
| MRR | Bot Proユーザー数 × 月額単価 |
| LTV | 平均継続月数 × 月額単価（`planHistory`から算出） |
| Pro転換率 | 月間Pro転換数 / 月初Free数 |
| Pro解約率 | 月間Pro→Free数 / 月初Pro数 |
| プラン変更履歴 | 日時・ユーザー・変更内容の一覧 |

**グラフ:**
- MRR推移（月別）
- Pro転換/解約の推移
- LTVの推移

---

### 4-7. カスタマーサクセス画面（CS指摘対応）

#### ヘルスダッシュボード

```
ヘルススコア分布:
🟢 Good (70-100):   120人 ████████████
🟡 At Risk (30-69):   45人 ████
🔴 Critical (0-29):   12人 █
```

#### 3段階アラートシステム

| 段階 | 条件 | アクション |
|---|---|---|
| **注意** | 2日未学習 | 自動ナッジを通常より強めに切替 |
| **警告** | 4日未学習 | 管理画面にイエロー表示、ユーザー一覧で上位に |
| **危険** | 6日未学習（Proのみ） | 講師にLINE通知 + 個別フォローアクション提案 |

#### オンボーディングモニター

| ステップ | 達成条件 | 全体達成率 |
|---|---|---|
| 初回テキスト | totalChats >= 1 | ??% |
| レベル判定完了 | englishLevel !== "unset" | ??% |
| 通知時間設定 | pushTime !== "08:00" | ??% |
| 初回音声 | totalVoice >= 1 | ??% |
| 3日連続 | streak_3達成 | ??% |

- ステップ別のドロップ率を表示
- 未完了ユーザーへのセグメント配信リンク

#### コホート分析（CMO・CS共通）

```
         W1    W2    W3    W4    W8    W12
1月組   100%   72%   58%   51%   34%   28%
2月組   100%   68%   55%   ...
3月組   100%   75%   ...
```

- 登録週をコホートとし、N週後の継続率を表示
- Pro/Free別に表示切替

---

### 4-8. システム設定

| 設定項目 | 現在値 | 変更可否 |
|---|---|---|
| Free テキスト上限 | 3回/日 | ○ |
| Free 音声上限 | 0回/日 | ○ |
| Pro テキスト上限 | 20回/日 | ○ |
| Pro 音声上限 | 5回/日 | ○ |
| AIモデル | claude-sonnet-4 | ○ |
| max_tokens | 800 | ○ |
| タイムアウト | 30秒 | ○ |
| コンテキストウィンドウ | 5件 | ○ |
| コンテキストリセット | 60分 | ○ |
| プッシュバッチサイズ | 10 | ○ |
| バッチ遅延 | 200ms | ○ |
| 離脱検知日数 | 5日 | ○ |
| 一斉配信上限 | 3回/日 | ○ |

※ 全設定変更は監査ログに記録

---

## 5. 非機能要件

| 項目 | 要件 |
|---|---|
| 認証 | Firebase Authentication + Custom Claims（admin / instructor） |
| 認可 | Firestore Security Rules + API Routes の二重検証 |
| 監査 | 全管理操作を `adminActions` コレクションに記録 |
| ホスティング | Firebase Hosting または Vercel |
| レスポンシブ | PC優先、タブレット対応（スマホは非対応可） |
| パフォーマンス | ダッシュボードは集計済みデータ参照で2秒以内に表示 |
| セキュリティ | 管理者ロールのみ読み書き許可、CSRF対策、入力サニタイズ |

---

## 6. 技術スタック

| レイヤー | 技術 |
|---|---|
| フロントエンド | Next.js（App Router）+ TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| グラフ | Recharts |
| 認証 | Firebase Auth + Custom Claims |
| データ | Firestore（既存 + 集計コレクション）+ Firebase Admin SDK |
| API | Next.js API Routes → Firebase Admin SDK |
| ホスティング | Firebase Hosting or Vercel |
| 集計バッチ | Cloud Functions（既存インフラに追加） |

---

## 7. 優先度とロードマップ

### P0 — MVP（まず動くものを）

| 機能 | 詳細 |
|---|---|
| **日次集計バッチ** | `stats/daily` を生成するCloud Function |
| **監査ログ基盤** | `adminActions` コレクション + 記録ユーティリティ |
| **認証・ロール** | Firebase Auth + Custom Claims 設定 |
| **ダッシュボード** | KPIカード + DAU推移グラフ + ファネル指標 |
| **ユーザー一覧** | ソート・フィルタ・プリセットフィルタ |
| **ユーザー詳細** | プロフィール + チャット履歴 + ヘルススコア表示 |
| **プラン変更** | Free ↔ Bot Pro の手動切替（監査ログ付き） |
| **ヘルススコア** | 日次バッチで算出、ユーザー一覧に表示 |
| **オンボーディング進捗** | 5ステップの達成状況表示 |

### P1 — 運用強化

| 機能 | 詳細 |
|---|---|
| **問題プールのFirestore移行** | ソースコードからDB移行 + マイグレーションスクリプト |
| **コンテンツ管理** | 問題・ナッジの閲覧・編集 |
| **トークン消費レポート** | 日別・月別グラフ |
| **個別メッセージ送信** | 確認ダイアログ + 監査ログ |
| **セグメント配信** | 条件設定 + プレビュー + 送信 |
| **3段階アラート** | 注意 / 警告 / 危険の自動分類 |
| **介入履歴** | 自動ナッジ・管理者アクションの記録と表示 |
| **コホート分析** | 登録週別の継続率テーブル |

### P2 — 分析・収益

| 機能 | 詳細 |
|---|---|
| **売上ダッシュボード** | MRR / LTV / 転換率 / 解約率 |
| **プラン変更履歴** | タイムライン表示 |
| **レベル遷移分析** | 昇格までの平均日数・パターン |
| **成功ユーザーパターン分析** | 行動特徴の可視化 |
| **プッシュ配信履歴・応答率** | 配信効果の計測 |
| **システム設定画面** | 管理画面からのパラメータ変更 |

### P3 — 拡張

| 機能 | 詳細 |
|---|---|
| **講師ロール** | instructor権限の実装 |
| **定期サーベイ** | LINE経由のNPS収集と集計 |
| **BigQuery連携** | 全文検索・高度な分析 |
| **友だち追加経路追跡** | UTMパラメータ対応 |

---

## 8. 必要なバックエンド変更（既存コードへの影響）

| 変更 | 影響範囲 | タイミング |
|---|---|---|
| User型に `healthScore`, `onboardingStatus`, `levelHistory`, `planHistory`, `interventions` 追加 | `src/types/index.ts` | P0 |
| 日次集計Function追加 | `src/scheduledFunctions/` に新規追加 | P0 |
| ヘルススコア算出ロジック追加 | `src/utils/` に新規追加 | P0 |
| chatLog保存時にdaily統計カウンターを更新 | `src/handlers/textChat.ts`, `voiceChat.ts` | P0 |
| follow/unfollow時にdaily統計カウンターを更新 | `src/handlers/webhook.ts` | P0 |
| プラン変更時に `planHistory` 記録 | `src/services/firestore.ts` | P0 |
| レベル変更時に `levelHistory` 記録 | `src/handlers/textChat.ts` | P0 |
| 問題プールをFirestoreに移行 | `src/prompts/pushMessages.ts` → Firestore | P1 |
| ナッジ送信時に `interventions` 記録 | `src/handlers/scheduler.ts` | P1 |
