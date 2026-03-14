#!/bin/bash
# GitHub Issues 一括登録スクリプト
# 使い方: gh auth login 後に実行
# ./scripts/create-issues.sh

set -euo pipefail

REPO="mkmanabu122003/ai-english-coach"

echo "=== Phase 1 ラベル作成 ==="
gh label create "phase:1" --color "0E8A16" --description "Phase 1: 基盤強化（2名→10名）" -R "$REPO" 2>/dev/null || true
gh label create "phase:2" --color "1D76DB" --description "Phase 2: スケール+法人開拓（10名→50名）" -R "$REPO" 2>/dev/null || true
gh label create "phase:3" --color "5319E7" --description "Phase 3: 月100万利益+B2B拡大（50名→260名）" -R "$REPO" 2>/dev/null || true
gh label create "type:feature" --color "A2EEEF" --description "新機能" -R "$REPO" 2>/dev/null || true
gh label create "type:content" --color "F9D0C4" --description "コンテンツ作成" -R "$REPO" 2>/dev/null || true
gh label create "type:infra" --color "D4C5F9" --description "インフラ・監視" -R "$REPO" 2>/dev/null || true
gh label create "type:business" --color "FEF2C0" --description "ビジネス施策（開発不要）" -R "$REPO" 2>/dev/null || true
gh label create "priority:high" --color "B60205" --description "最優先" -R "$REPO" 2>/dev/null || true
gh label create "priority:medium" --color "FBCA04" --description "中優先" -R "$REPO" 2>/dev/null || true

echo ""
echo "=== Phase 1 Issues（基盤強化 + 収益構造の構築）==="

# --- P1-1: ウェルカムメッセージ改善 ---
gh issue create -R "$REPO" \
  --title "[P1] ウェルカムメッセージを3ステップ・オンボーディングに改善" \
  --label "phase:1,type:feature,priority:high" \
  --body "$(cat <<'BODY'
## 概要
現在のウェルカムメッセージを、段階的なオンボーディングフローに改善する。

## 背景
初日に「Bot返信の体験」を完了させ、翌日プッシュ通知の受け取りまでつなげることが目標。
自己紹介はどのレベルでも答えられ、内容の充実度でレベル判定が正確になる。

## タスク
- [ ] `webhook.ts` のフォローイベントハンドラでウェルカムメッセージを更新
- [ ] ステップ1: フォロー直後のメッセージ（Botの機能説明 + 自己紹介の促し）
- [ ] ステップ2: 初回返信後のヒント表示（`textChat.ts` の `totalChats === 0` 分岐、実装済み）
- [ ] ステップ3: 翌日のプッシュ通知で初回専用メッセージを送信（`scheduler.ts`）

## 対象ファイル
- `src/handlers/webhook.ts`
- `src/handlers/scheduler.ts`

## 参照
運用設計書 セクション5.1
BODY
)"

# --- P1-2: レベル別プッシュ質問 ---
gh issue create -R "$REPO" \
  --title "[P1] レベル別にプッシュ質問を出し分ける" \
  --label "phase:1,type:feature,priority:high" \
  --body "$(cat <<'BODY'
## 概要
現在30問の質問プールは全レベル共通。ユーザーのenglishLevelに応じて適切な難易度の質問を出し分ける。

## タスク
- [ ] `pushMessages.ts` の質問に `level` フィールドを追加（beginner / intermediate / advanced）
- [ ] `scheduler.ts` の `dailyPush` でユーザーのレベルに応じた質問をフィルタリング
- [ ] レベル未設定（"unset"）の場合は beginner の質問を送信

## 質問の難易度基準
| レベル | 特徴 | 例 |
|--------|------|-----|
| Beginner | 短い回答で済む、具体的な場面 | "How do you say 'いただきます' to your guests at lunch?" |
| Intermediate | 比較・説明が必要 | "How would you explain the difference between a shrine and a temple?" |
| Advanced | 深い文化理解＋即興力 | "A guest says: 'Isn't wabi-sabi just an excuse for imperfection?' How do you respond?" |

## 対象ファイル
- `src/prompts/pushMessages.ts`
- `src/handlers/scheduler.ts`

## 参照
運用設計書 セクション5.2
BODY
)"

# --- P1-3: 質問プール拡充 ---
gh issue create -R "$REPO" \
  --title "[P1] 質問プールを30問→60問に拡充" \
  --label "phase:1,type:content,priority:medium" \
  --body "$(cat <<'BODY'
## 概要
現在6カテゴリ×5問=30問の質問プールを、各カテゴリ10問に拡充する。
60問あれば2ヶ月間重複なく毎日1問出題可能。

## タスク
- [ ] 既存6カテゴリそれぞれに5問ずつ追加（計30問追加）
- [ ] 追加する質問にレベル（beginner/intermediate/advanced）を付与
- [ ] "comparison, not translation"メソッドに沿った質問内容にする

## カテゴリ
1. shrine_temple（神社仏閣）
2. food（食文化）
3. daily_life（日常生活）
4. concept（日本文化の概念）
5. practical（実践的な場面対応）
6. nature（自然・季節）

## 対象ファイル
- `src/prompts/pushMessages.ts`

## 参照
運用設計書 セクション13
BODY
)"

# --- P1-4: 音声練習促進 ---
gh issue create -R "$REPO" \
  --title "[P1] テキスト3回返信後に音声練習を促すメッセージを追加" \
  --label "phase:1,type:feature,priority:medium" \
  --body "$(cat <<'BODY'
## 概要
通訳ガイドは「話す力」が最重要。テキストのみの利用者に音声練習を促す。

## 現状
`textChat.ts` に既に実装済み（テキスト3回ごと＋当日音声0回の場合に促進メッセージ表示）。
動作確認と、メッセージ内容の改善を行う。

## タスク
- [ ] 既存ロジック（`textChat.ts:106-114`）の動作確認
- [ ] 促進メッセージの文言改善（より自然な誘導に）
- [ ] 音声フィードバック時に「模範スクリプト」を追加する検討

## 対象ファイル
- `src/handlers/textChat.ts`

## 参照
運用設計書 セクション5.3
BODY
)"

# --- P1-5: Freeプラン実装 ---
gh issue create -R "$REPO" \
  --title "[P1] Freeプラン（制限付き無料利用）の実装" \
  --label "phase:1,type:feature,priority:high" \
  --body "$(cat <<'BODY'
## 概要
集客のフリーミアム層として、制限付き無料プランを実装する。

## Free プランの制限
- テキスト: 3回/日（Bot Proは20回）
- 音声: 利用不可（Bot Proは5回）
- ウィークリーレポート: なし（Bot Proはあり）
- プッシュ通知: 毎日1問（Bot Proと同じ）

## タスク
- [ ] `types/index.ts` の User 型に `plan` フィールド追加（"free" | "bot_pro" | "standard" | "premium" | "private"）
- [ ] `constants.ts` にプラン別のレート制限値を定義
- [ ] `rateLimiter.ts` でプランに応じた制限を適用
- [ ] `voiceChat.ts` でFreeプランの場合にメッセージ返却（「音声練習はBot Proプランで利用できます」）
- [ ] `scheduler.ts` のウィークリーレポートでFreeプランを除外
- [ ] 新規ユーザーのデフォルトプランを "free" に設定

## 対象ファイル
- `src/types/index.ts`
- `src/config/constants.ts`
- `src/middleware/rateLimiter.ts`
- `src/handlers/voiceChat.ts`
- `src/handlers/scheduler.ts`
- `src/services/firestore.ts`

## 参照
運用設計書 セクション2.3
BODY
)"

# --- P1-6: 監視・アラート ---
gh issue create -R "$REPO" \
  --title "[P1] GCP Cloud Monitoring で基本的な監視・アラートを設定" \
  --label "phase:1,type:infra,priority:medium" \
  --body "$(cat <<'BODY'
## 概要
本番運用に最低限必要な監視とアラートを設定する。

## タスク
- [ ] Cloud Functions のエラー率アラート（5%超過/10分間 → メール通知）
- [ ] Webhook応答時間アラート（30秒超過 → メール通知）
- [ ] Claude API 429エラー（レート制限）のアラート
- [ ] dailyPush / weeklyReport の実行成功率の監視
- [ ] 日次API利用量の異常検知（前日比200%超過）
- [ ] Cloud Monitoring ダッシュボード作成（基本メトリクス）

## 参照
運用設計書 セクション14.1
BODY
)"

# --- P1-7: 離脱検知 ---
gh issue create -R "$REPO" \
  --title "[P1] 無活動生徒の離脱検知 → 講師へのLINEアラート自動化" \
  --label "phase:1,type:feature,priority:medium" \
  --body "$(cat <<'BODY'
## 概要
生徒が一定期間無活動の場合、講師のLINEに通知を送る。

## 段階的介入フロー
| 無活動日数 | アクション |
|-----------|----------|
| 2日 | Bot自動ナッジ（gentle） ← 既存実装あり |
| 3日 | Bot自動ナッジ（strong）+ ストリーク復活案内 |
| 5日 | 講師にLINEアラート通知 |
| 7日 | 講師から個別メッセージ送信（手動） |

## タスク
- [ ] 講師のLINE UserIdを環境変数 or Firestoreに登録
- [ ] `scheduler.ts` に日次チェック処理を追加（毎朝実行）
- [ ] 5日以上無活動の生徒を検出し、講師にLINEメッセージ送信
- [ ] アラートの重複送信防止（一度通知したら再通知しない）
- [ ] Firestore に `alerts/` コレクション追加

## 対象ファイル
- `src/handlers/scheduler.ts`
- `src/services/firestore.ts`
- `src/services/line.ts`

## 参照
運用設計書 セクション6.1
BODY
)"

# --- P1-8: マイルストーン通知 ---
gh issue create -R "$REPO" \
  --title "[P1] 学習マイルストーン達成時の通知メッセージを実装" \
  --label "phase:1,type:feature,priority:medium" \
  --body "$(cat <<'BODY'
## 概要
短期的な成功体験を提供するため、マイルストーン達成時にお祝いメッセージを送信。

## マイルストーン一覧
| マイルストーン | 通知メッセージ |
|-------------|--------------|
| 初回返信完了 | 最初の一歩を踏み出しました！ |
| 3日連続 | 3日連続達成！いい調子です！ |
| 7日連続 | 1週間連続！習慣化の第一歩です！ |
| 30日連続 | 30日連続達成！素晴らしい継続力です！ |
| 100回チャット | チャット100回突破！確実に力がついています！ |
| 初音声練習 | 初めての音声練習クリア！話す力が伸びます！ |

## タスク
- [ ] マイルストーン判定ロジックを作成（`utils/milestones.ts`）
- [ ] `textChat.ts` / `voiceChat.ts` のレスポンス後にマイルストーンチェック
- [ ] 達成済みマイルストーンの記録（重複通知防止）
- [ ] User型に `achievedMilestones: string[]` を追加

## 対象ファイル
- 新規: `src/utils/milestones.ts`
- `src/handlers/textChat.ts`
- `src/handlers/voiceChat.ts`
- `src/types/index.ts`

## 参照
運用設計書 セクション6.2
BODY
)"

# --- P1-9: 集中プログラム企画 ---
gh issue create -R "$REPO" \
  --title "[P1] 集中プログラム（3ヶ月チャレンジ / 8週間コース）の企画・募集準備" \
  --label "phase:1,type:business" \
  --body "$(cat <<'BODY'
## 概要
Bot Proを入口に、高単価の集中プログラムを販売する。
開発は不要（Bot Proの機能 + 定期的な個別フィードバックで提供）。

## プログラム案
| プログラム | 価格 | 内容 |
|-----------|------|------|
| 3ヶ月チャレンジ | ¥29,800 | Bot Pro 3ヶ月 + 月1回個別フィードバック(15分) + 修了証 |
| 集中8週間コース | ¥49,800 | Bot Pro + 週1回グループレッスン(オンライン30分×8回) + 修了証 |

## タスク
- [ ] プログラム内容の詳細設計（カリキュラム、週ごとのテーマ）
- [ ] 募集ページの作成（LP or LINE内での案内文）
- [ ] 修了証のデザイン
- [ ] 申込・決済フローの決定（Stripe? 銀行振込?）
- [ ] 既存2名の生徒への案内

## 参照
運用設計書 セクション2.3（集中プログラム）
BODY
)"

# --- P1-10: コンテンツ商品 ---
gh issue create -R "$REPO" \
  --title "[P1] コンテンツ商品の制作（観光英語フレーズ集PDF）" \
  --label "phase:1,type:content" \
  --body "$(cat <<'BODY'
## 概要
制作コスト1回、売上は繰り返し発生するストック型収益商品。

## 商品案
| 商品 | 価格 | 内容 |
|------|------|------|
| 観光英語フレーズ集 200選 | ¥2,980 | ガイド実務で使える表現集 |
| 文化比較メソッド完全ガイド | ¥4,980 | "comparison, not translation"の実践ガイド |

## タスク
- [ ] フレーズ集の構成案作成（カテゴリ分け、各フレーズの解説形式）
- [ ] 200フレーズの執筆
- [ ] PDF デザイン・レイアウト
- [ ] 販売チャネルの決定（Gumroad? note? 直販?）
- [ ] Bot内での案内メッセージ設計

## 参照
運用設計書 セクション2.3（コンテンツ課金）
BODY
)"

echo ""
echo "=== Phase 2 Issues（スケール + 法人開拓）==="

# --- P2-1: マルチテナント ---
gh issue create -R "$REPO" \
  --title "[P2] マルチテナント対応: User型にorgId追加 + organizations コレクション" \
  --label "phase:2,type:feature,priority:high" \
  --body "$(cat <<'BODY'
## 概要
法人契約（to B展開）に向けて、企業→メンバーの階層管理を実装する。

## データ構造
```
organizations/{orgId}/
  name, plan, maxMembers, adminUserIds, billingEmail

organizations/{orgId}/members/{lineUserId}/
  role, enrolledAt, status

users/{lineUserId}/
  orgId: "org_xxx" | null  ← 追加フィールド
```

## タスク
- [ ] `types/index.ts` に Organization 型を追加
- [ ] User型に `orgId` フィールドを追加（nullable）
- [ ] `firestore.ts` に組織CRUD関数を追加
- [ ] Firestoreセキュリティルールの設計
- [ ] 既存ユーザーへの影響なし（orgId = null）を確認

## 参照
運用設計書 セクション7.6
BODY
)"

# --- P2-2: 週テーマ制 ---
gh issue create -R "$REPO" \
  --title "[P2] 週テーマ制: 1週間同じカテゴリの質問を集中出題" \
  --label "phase:2,type:feature" \
  --body "$(cat <<'BODY'
## 概要
1週間同じカテゴリの質問を集中的に出すことで、語彙と表現パターンの定着を促進。

## テーマローテーション例
Week 1: shrine_temple → Week 2: food → Week 3: daily_life → ...

## タスク
- [ ] 週テーマのスケジュール管理ロジック
- [ ] `scheduler.ts` でテーマに基づく質問フィルタリング
- [ ] 月曜のプッシュ通知で「今週のテーマ」を告知

## 参照
運用設計書 セクション5.3
BODY
)"

# --- P2-3: ウィークリーレポート強化 ---
gh issue create -R "$REPO" \
  --title "[P2] ウィークリーレポート強化: カテゴリ別分析 + 成長可視化" \
  --label "phase:2,type:feature" \
  --body "$(cat <<'BODY'
## 概要
ウィークリーレポートにカテゴリ別の傾向分析と成長の可視化を追加。

## タスク
- [ ] カテゴリ別の回答傾向をチャットログから集計
- [ ] Before/After 形式での成長表示
- [ ] レポートプロンプトの改善
- [ ] Freeプランではレポートを送信しない制御

## 参照
運用設計書 セクション6.2
BODY
)"

# --- P2-4: レベルアップ自動判定 ---
gh issue create -R "$REPO" \
  --title "[P2] レベルアップ自動判定ロジックの実装" \
  --label "phase:2,type:feature" \
  --body "$(cat <<'BODY'
## 概要
累計チャット数とAIフィードバック品質に基づき、レベルアップを自動提案。

## 判定条件（案）
- 累計チャット50回以上
- 直近10回のAIフィードバックで「改善ポイント」が2つ以下の割合が70%以上
- → レベルアップ提案メッセージを送信 → ユーザー承認でレベル変更

## 参照
運用設計書 セクション5.4
BODY
)"

# --- P2-5: 講師向け進捗確認 ---
gh issue create -R "$REPO" \
  --title "[P2] 講師向け進捗確認コマンド（LINE内）" \
  --label "phase:2,type:feature" \
  --body "$(cat <<'BODY'
## 概要
講師がLINEで「進捗確認」と送ると、担当生徒の一覧と学習状態を返す。

## 表示例
```
📊 担当生徒 進捗一覧（5名）
🟢 田中さん: ストリーク 12日 / 音声率 30%
🟡 佐藤さん: ストリーク 0日 / 最終: 3日前
🔴 山田さん: ストリーク 0日 / 最終: 7日前
```

## タスク
- [ ] 講師ユーザーの識別方法（UserIdをFirestoreに登録）
- [ ] 「進捗確認」コマンドの追加
- [ ] 全生徒の状態サマリー生成ロジック

## 参照
運用設計書 セクション7.4
BODY
)"

# --- P2-6: Webダッシュボード ---
gh issue create -R "$REPO" \
  --title "[P2] 法人向け最小Webダッシュボード（Googleログイン）" \
  --label "phase:2,type:feature,priority:high" \
  --body "$(cat <<'BODY'
## 概要
法人契約開始時に、企業担当者がメンバーの学習状況を確認できるWebダッシュボードを構築。

## 技術スタック
- Next.js + Firebase Auth（Googleログイン）+ Firestore直接読み取り

## Step 1（最小構成）
- 画面: メンバー一覧 + 個別詳細の2画面のみ
- 認証: Googleログインのみ（adminUserIdsと照合）
- データ: orgIdに紐づくメンバーのストリーク、最終活動日、学習日数

## 参照
運用設計書 セクション7.6
BODY
)"

# --- P2-7: アドオン課金 ---
gh issue create -R "$REPO" \
  --title "[P2] アドオン課金機能の実装（音声強化、詳細レポート等）" \
  --label "phase:2,type:feature" \
  --body "$(cat <<'BODY'
## 概要
Bot Pro（¥1,980）ベースに、オプション機能を追加購入できるようにする。

## アドオン一覧
| オプション | 月額 | 内容 |
|-----------|------|------|
| 音声強化パック | +¥500 | 音声15回/日（通常5回） |
| 詳細レポート | +¥300 | カテゴリ別分析 + Before/After比較 |
| 専門コンテンツパック | +¥500 | 120問の拡張質問プール |
| AI無制限 | +¥800 | テキスト回数制限なし |

## タスク
- [ ] User型に `addons: string[]` フィールド追加
- [ ] アドオンに応じたレート制限の動的変更
- [ ] 決済との連携方法の検討

## 参照
運用設計書 セクション2.3
BODY
)"

# --- P2-8: 単体テスト ---
gh issue create -R "$REPO" \
  --title "[P2] 単体テストの整備（Jest）" \
  --label "phase:2,type:infra" \
  --body "$(cat <<'BODY'
## 概要
数百名規模の運用に向けて、コア機能の単体テストを整備する。

## 優先テスト対象
- [ ] プロンプト生成（レベル別・カテゴリ別）
- [ ] レベル判定ロジック（初回判定、境界値）
- [ ] ストリーク計算（日付跨ぎ、タイムゾーン）
- [ ] レート制限（制限到達、リセット、プラン別）
- [ ] ナッジ判定（無活動日数に応じたメッセージタイプ）
- [ ] マイルストーン判定

## 参照
運用設計書 セクション14.2
BODY
)"

echo ""
echo "=== Phase 3 Issues（月100万利益 + B2B拡大）==="

# --- P3-1: 本格ダッシュボード ---
gh issue create -R "$REPO" \
  --title "[P3] 本格Webダッシュボード（組織切替、グラフ、CSVエクスポート）" \
  --label "phase:3,type:feature" \
  --body "$(cat <<'BODY'
## 概要
法人3社以上のスケールに対応する本格的な管理ダッシュボード。

## 追加機能
- 組織切り替え（講師が複数法人を管理）
- 集計グラフ（学習日数推移、アクティブ率等）
- CSVエクスポート
- 月次進捗レポートPDF出力
- メンバーの追加・削除・一時停止の管理

## 参照
運用設計書 セクション7.6
BODY
)"

# --- P3-2: 多言語対応 ---
gh issue create -R "$REPO" \
  --title "[P3] プロンプト・質問プールの多言語対応リファクタリング + スペイン語版" \
  --label "phase:3,type:feature" \
  --body "$(cat <<'BODY'
## 概要
英語版をベースに、スペイン語版を展開可能なアーキテクチャにリファクタリング。

## タスク
- プロンプトの言語パラメータ対応
- 質問プールの言語別分割（en.ts / es.ts）
- Speech-to-Textの言語設定切替
- スペイン語版LINE公式アカウント開設

## 参照
運用設計書 セクション8
BODY
)"

# --- P3-3: バッチ処理 ---
gh issue create -R "$REPO" \
  --title "[P3] 大規模バッチ処理の改善（Cloud Tasks）" \
  --label "phase:3,type:infra" \
  --body "$(cat <<'BODY'
## 概要
300名規模に対応するため、dailyPush / weeklyReport をCloud Tasksでキューイング。

## 現状
- バッチ10件ずつ、200msの間隔で順次処理
- 300名では処理時間がタイムアウトに近づく

## 改善案
- 1回の呼び出しで50名ずつ処理、残りをCloud Tasksに委譲
- dailyPush: 540s timeout, 512MB memory

## 参照
運用設計書 セクション7.5
BODY
)"

# --- P3-4: バッジシステム ---
gh issue create -R "$REPO" \
  --title "[P3] バッジ/称号システムの実装" \
  --label "phase:3,type:feature" \
  --body "$(cat <<'BODY'
## 概要
カテゴリ別バッジと称号を実装し、学習のゲーミフィケーションを強化。

## バッジ例
- 🏯 神社仏閣マスター → shrine_temple カテゴリで10問回答
- 🍣 食文化エキスパート → food カテゴリで10問回答
- 🎤 音声練習の達人 → 音声メッセージ累計30回
- 🔥 ストリークチャンピオン → 30日連続達成

## 参照
運用設計書 セクション6.2
BODY
)"

# --- P3-5: コミュニティ ---
gh issue create -R "$REPO" \
  --title "[P3] 生徒コミュニティ機能（匿名ランキング、ベストアンサー共有）" \
  --label "phase:3,type:feature" \
  --body "$(cat <<'BODY'
## 概要
仲間の存在を感じられる仕組みを追加し、エンゲージメントを向上。

## 機能
- 匿名ランキング（ウィークリーレポート内）
- 今週のベストアンサー共有（講師が選出）
- グループチャレンジ（月次、クラス全体の目標）

## 参照
運用設計書 セクション6.3
BODY
)"

# --- P3-6: バックアップ ---
gh issue create -R "$REPO" \
  --title "[P3] Firestoreデータバックアップの自動化" \
  --label "phase:3,type:infra" \
  --body "$(cat <<'BODY'
## 概要
Cloud Schedulerで日次バックアップを自動化し、災害復旧に備える。

## タスク
- Cloud Scheduler（毎日03:00 JST）でFirestoreエクスポート
- GCSバケットに保存、30日超過分を自動削除
- バックアップ完了通知（Slack or メール）

## 参照
運用設計書 セクション14.4
BODY
)"

echo ""
echo "=== 完了: 全issueを作成しました ==="
echo "Phase 1: 10 issues"
echo "Phase 2: 8 issues"
echo "Phase 3: 6 issues"
echo "合計: 24 issues"
