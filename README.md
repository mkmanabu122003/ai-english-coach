# AI English Coach

観光英語に特化した LINE Bot。全国通訳案内士の知見をベースに、ガイド向け英語添削・音声フィードバック・日次プッシュ通知・週次レポートを提供します。

## 構成

| レイヤー | 技術 |
|---------|------|
| Runtime | Node.js 20 / TypeScript |
| Infrastructure | Firebase Cloud Functions v2 (asia-northeast1) |
| Database | Cloud Firestore |
| AI | Anthropic Claude Sonnet 4 |
| 音声文字起こし | Google Cloud Speech-to-Text |
| メッセージング | LINE Messaging API |
| シークレット管理 | Google Cloud Secret Manager |
| CI/CD | GitHub Actions |

## 機能一覧

| 機能 | 説明 |
|------|------|
| テキスト添削 | 英文を送ると文法・表現を添削して返信 |
| 音声フィードバック | 音声メッセージを文字起こし → 添削 |
| レベル自動判定 | 初回メッセージで beginner/intermediate/advanced を判定 |
| 日次プッシュ通知 | pushTime に基づき毎時チェック、質問を送信 |
| 週次レポート | 日曜 10:00 に学習サマリーを送信 |
| ストリーク管理 | 連続学習日数を追跡 |
| レート制限 | テキスト 20 回/日、音声 5 回/日 |
| コマンド | 通知オン/オフ、レベル確認、ヘルプ |

## プロジェクト構造

```
src/
├── config/
│   ├── constants.ts          # レート制限、バッチサイズ等の定数
│   └── secrets.ts            # Secret Manager クライアント (キャッシュ付き)
├── handlers/
│   ├── webhook.ts            # LINE Webhook ルーター (署名検証 → イベント振り分け)
│   ├── textChat.ts           # テキストチャットハンドラ
│   ├── voiceChat.ts          # 音声チャットハンドラ
│   └── scheduler.ts          # 日次プッシュ / 週次レポート
├── middleware/
│   ├── errorHandler.ts       # エラーハンドリング (ユーザーへのエラー返信)
│   ├── rateLimiter.ts        # 日次レート制限
│   └── validator.ts          # 入力サニタイズ
├── prompts/
│   ├── systemPrompt.ts       # システムプロンプト / レベル抽出
│   ├── voicePrompt.ts        # 音声フィードバック用追加プロンプト
│   ├── reportPrompt.ts       # 週次レポート生成プロンプト
│   └── pushMessages.ts       # 質問プール / ナッジメッセージ
├── services/
│   ├── firestore.ts          # Firestore CRUD
│   ├── line.ts               # LINE Messaging API クライアント
│   └── openai.ts             # Anthropic Claude API / Google Speech-to-Text
├── types/
│   └── index.ts              # TypeScript 型定義
├── utils/
│   ├── dateUtils.ts          # JST 日付ユーティリティ
│   ├── messageFormatter.ts   # メッセージ分割 (5000文字制限対応)
│   └── streak.ts             # ストリーク計算
└── index.ts                  # Cloud Functions エントリーポイント
```

## 初期セットアップ

### 1. GCP プロジェクト

```bash
firebase login
firebase projects:create YOUR_GCP_PROJECT_ID
firebase use YOUR_GCP_PROJECT_ID

# Blaze プランにアップグレード (課金を有効化)
# https://console.firebase.google.com/project/YOUR_GCP_PROJECT_ID/usage/details

# 必要な API を有効化
gcloud services enable secretmanager.googleapis.com
gcloud services enable cloudscheduler.googleapis.com
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable speech.googleapis.com

# Firestore を有効化
firebase init firestore
```

### 2. LINE Developers

1. [LINE Developers Console](https://developers.line.biz/) でプロバイダーとチャネルを作成
2. Messaging API チャネルを選択
3. チャネルシークレットとチャネルアクセストークン（長期）を取得
4. Webhook URL にデプロイ後の Cloud Functions URL を設定
5. Webhook の利用をオンに設定
6. 応答メッセージをオフに設定

### 3. Secret Manager

3 つのシークレットを登録:

| シークレット名 | 説明 |
|---------------|------|
| `LINE_CHANNEL_SECRET` | LINE チャネルシークレット |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE チャネルアクセストークン（長期） |
| `ANTHROPIC_API_KEY` | Anthropic API キー |

```bash
echo -n "値" | gcloud secrets create LINE_CHANNEL_SECRET --data-file=-
echo -n "値" | gcloud secrets create LINE_CHANNEL_ACCESS_TOKEN --data-file=-
echo -n "値" | gcloud secrets create ANTHROPIC_API_KEY --data-file=-
```

Cloud Functions のサービスアカウントにアクセス権を付与:

```bash
# Cloud Functions 2nd Gen は Compute Engine のデフォルト SA を使用
SA="PROJECT_NUMBER-compute@developer.gserviceaccount.com"

for SECRET in LINE_CHANNEL_SECRET LINE_CHANNEL_ACCESS_TOKEN ANTHROPIC_API_KEY; do
  gcloud secrets add-iam-policy-binding $SECRET \
    --member="serviceAccount:$SA" \
    --role="roles/secretmanager.secretAccessor"
done
```

### 4. Cloud Scheduler

```bash
# 日次プッシュ通知 (毎時実行)
gcloud scheduler jobs create http daily-push \
  --schedule="0 */1 * * *" \
  --uri="DAILY_PUSH_FUNCTION_URL" \
  --time-zone="Asia/Tokyo" \
  --oidc-service-account-email=YOUR_GCP_PROJECT_ID@appspot.gserviceaccount.com

# 週次レポート (毎週日曜 10:00 JST)
gcloud scheduler jobs create http weekly-report \
  --schedule="0 10 * * 0" \
  --uri="WEEKLY_REPORT_FUNCTION_URL" \
  --time-zone="Asia/Tokyo" \
  --oidc-service-account-email=YOUR_GCP_PROJECT_ID@appspot.gserviceaccount.com
```

## 開発フロー

### ローカル開発

```bash
npm install

# .env を作成 (ローカルでは Secret Manager の代わりに環境変数を使用)
cp .env.example .env
# .env の各値を実際の値に編集

# Firebase エミュレーターで起動
npm run serve
```

### コード変更 → デプロイ

```
1. ブランチを作成
   git checkout -b feature/xxx

2. コードを変更

3. ビルド確認
   npm run build

4. コミット & プッシュ
   git add <files>
   git commit -m "変更内容"
   git push origin feature/xxx

5. Pull Request を作成 → レビュー → main にマージ

6. main へのマージで GitHub Actions が自動デプロイ
```

### CI/CD (GitHub Actions)

`main` ブランチへの push 時に自動デプロイが実行されます。

**ワークフロー** (`.github/workflows/deploy.yml`):
1. `npm ci` → `npm run build` でビルド
2. GCP サービスアカウントで認証
3. `firebase deploy --only functions,firestore:indexes` を実行

**必要な GitHub Secret**:

| Secret 名 | 説明 |
|-----------|------|
| `GCP_SA_KEY` | デプロイ用 GCP サービスアカウントの JSON キー |

### 手動デプロイ

```bash
# 全関数をデプロイ
firebase deploy --only functions

# Firestore インデックスのみ
firebase deploy --only firestore:indexes
```

## 運用・保守

### ログの確認

```bash
# 直近のログを確認
gcloud functions logs read webhook --region=asia-northeast1 --limit=20 --gen2

# 詳細なエラーログ (Cloud Logging)
gcloud logging read \
  'resource.type="cloud_run_revision" AND resource.labels.service_name="webhook" AND severity>=ERROR' \
  --project=YOUR_GCP_PROJECT_ID --limit=10 --format=json
```

Google Cloud Console からも確認可能:
https://console.cloud.google.com/logs/query?project=YOUR_GCP_PROJECT_ID

### シークレットの更新

API キーの更新が必要な場合:

```bash
# 新しいバージョンを追加 (旧バージョンは自動で無効化)
echo -n "新しい値" | gcloud secrets versions add ANTHROPIC_API_KEY --data-file=-

# 関数を再デプロイしてキャッシュをクリア
firebase deploy --only functions
```

または Google Cloud Console から:
https://console.cloud.google.com/security/secret-manager?project=YOUR_GCP_PROJECT_ID

### モニタリング

| 項目 | 確認先 |
|------|--------|
| 関数の実行状況 | [Cloud Functions](https://console.cloud.google.com/functions?project=YOUR_GCP_PROJECT_ID) |
| エラーレート | [Error Reporting](https://console.cloud.google.com/errors?project=YOUR_GCP_PROJECT_ID) |
| Firestore 使用量 | [Firestore Console](https://console.firebase.google.com/project/YOUR_GCP_PROJECT_ID/firestore) |
| Scheduler ジョブ状態 | [Cloud Scheduler](https://console.cloud.google.com/cloudscheduler?project=YOUR_GCP_PROJECT_ID) |

### トラブルシューティング

| 症状 | 原因と対処 |
|------|-----------|
| Bot が全く応答しない | LINE Webhook URL が正しいか確認。ログで署名検証エラーを確認 |
| 「一時的にエラー」と返る | ログで具体的なエラーを確認。Anthropic API キーの残高不足が多い |
| 音声が認識されない | Speech-to-Text API が有効か確認。音声の長さが 3 分以内か確認 |
| プッシュ通知が届かない | Cloud Scheduler のジョブが ENABLED か確認。ログで IAM エラーを確認 |
| デプロイが失敗する | `npm run build` でローカルビルドが通るか確認。GitHub Secret が正しいか確認 |

### 主要なサービスアカウント

| SA | 用途 |
|----|------|
| `PROJECT_NUMBER-compute@developer.gserviceaccount.com` | Cloud Functions 2nd Gen の実行 SA。Secret Manager へのアクセスが必要 |
| `github-actions-deploy@PROJECT_ID.iam.gserviceaccount.com` | GitHub Actions からのデプロイ用 |

### コスト管理

- **Anthropic API**: https://console.anthropic.com/settings/billing でクレジット残高を確認
- **GCP**: https://console.cloud.google.com/billing で課金状況を確認
- Cloud Functions の無料枠: 200 万回/月の呼び出し、40 万 GB 秒のコンピューティング
- Firestore の無料枠: 1 GiB ストレージ、5 万回/日の読み取り
