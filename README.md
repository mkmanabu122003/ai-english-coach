# AI English Coach

観光英語に特化した LINE Bot。全国通訳案内士の知見をベースに、ガイド向け英語添削・音声フィードバック・日次プッシュ通知・週次レポートを提供します。

## 構成

- **Runtime**: Node.js 20 / TypeScript
- **Infrastructure**: Firebase Cloud Functions v2 (asia-northeast1)
- **Database**: Cloud Firestore
- **APIs**: OpenAI (GPT-4o / Whisper), LINE Messaging API
- **Secrets**: Google Cloud Secret Manager

## セットアップ

### 1. GCP プロジェクト

```bash
# Firebase プロジェクトを作成し、Blaze プランにアップグレード
firebase login
firebase projects:create YOUR_GCP_PROJECT_ID

# Firestore を有効化
firebase init firestore

# 必要な API を有効化
gcloud services enable secretmanager.googleapis.com
gcloud services enable cloudscheduler.googleapis.com
gcloud services enable cloudfunctions.googleapis.com
```

### 2. LINE Developers

1. [LINE Developers Console](https://developers.line.biz/) でプロバイダーとチャネルを作成
2. Messaging API チャネルを選択
3. チャネルシークレットとチャネルアクセストークン（長期）を取得
4. Webhook URL に Cloud Functions の URL を設定:
   `https://asia-northeast1-YOUR_GCP_PROJECT_ID.cloudfunctions.net/webhook`
5. Webhook の利用をオンに設定
6. 応答メッセージをオフに設定

### 3. Secret Manager

```bash
# シークレットを登録
echo -n "YOUR_LINE_CHANNEL_SECRET" | \
  gcloud secrets create LINE_CHANNEL_SECRET --data-file=-

echo -n "YOUR_LINE_CHANNEL_ACCESS_TOKEN" | \
  gcloud secrets create LINE_CHANNEL_ACCESS_TOKEN --data-file=-

echo -n "YOUR_OPENAI_API_KEY" | \
  gcloud secrets create OPENAI_API_KEY --data-file=-

# Cloud Functions のサービスアカウントにアクセス権を付与
gcloud secrets add-iam-policy-binding LINE_CHANNEL_SECRET \
  --member="serviceAccount:YOUR_GCP_PROJECT_ID@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding LINE_CHANNEL_ACCESS_TOKEN \
  --member="serviceAccount:YOUR_GCP_PROJECT_ID@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding OPENAI_API_KEY \
  --member="serviceAccount:YOUR_GCP_PROJECT_ID@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 4. プロジェクト設定

```bash
# 依存パッケージをインストール
npm install

# .firebaserc のプロジェクト ID を設定
firebase use YOUR_GCP_PROJECT_ID

# ローカル開発用 (任意)
cp .env.example .env
# .env の各値を実際の値に置き換え
```

## デプロイ

```bash
# ビルド + デプロイ
firebase deploy --only functions

# Firestore インデックスのデプロイ
firebase deploy --only firestore:indexes
```

## Cloud Scheduler

```bash
# 日次プッシュ通知（毎時実行、pushTime に一致するユーザーに送信）
gcloud scheduler jobs create http daily-push \
  --schedule="0 */1 * * *" \
  --uri="https://asia-northeast1-YOUR_GCP_PROJECT_ID.cloudfunctions.net/dailyPush" \
  --time-zone="Asia/Tokyo" \
  --oidc-service-account-email=YOUR_GCP_PROJECT_ID@appspot.gserviceaccount.com

# 週次レポート（毎週日曜 10:00 JST）
gcloud scheduler jobs create http weekly-report \
  --schedule="0 10 * * 0" \
  --uri="https://asia-northeast1-YOUR_GCP_PROJECT_ID.cloudfunctions.net/weeklyReport" \
  --time-zone="Asia/Tokyo" \
  --oidc-service-account-email=YOUR_GCP_PROJECT_ID@appspot.gserviceaccount.com
```

## ローカル開発

```bash
# Firebase エミュレーターで起動
npm run serve
```

## プロジェクト構造

```
src/
├── config/
│   ├── constants.ts          # レート制限、バッチサイズ等の定数
│   └── secrets.ts            # Secret Manager クライアント
├── handlers/
│   ├── webhook.ts            # LINE Webhook ルーター
│   ├── textChat.ts           # テキストチャットハンドラ
│   ├── voiceChat.ts          # 音声チャットハンドラ
│   └── scheduler.ts          # 日次プッシュ / 週次レポート
├── middleware/
│   ├── errorHandler.ts       # エラーハンドリング
│   ├── rateLimiter.ts        # 日次レート制限
│   └── validator.ts          # 入力サニタイズ
├── prompts/
│   ├── systemPrompt.ts       # システムプロンプト / レベル抽出
│   ├── voicePrompt.ts        # 音声フィードバックフォーマット
│   ├── reportPrompt.ts       # 週次レポート生成プロンプト
│   └── pushMessages.ts       # 質問プール / ナッジメッセージ
├── services/
│   ├── firestore.ts          # Firestore CRUD
│   ├── line.ts               # LINE Messaging API
│   └── openai.ts             # OpenAI (GPT-4o / Whisper)
├── types/
│   └── index.ts              # TypeScript 型定義
├── utils/
│   ├── dateUtils.ts          # JST 日付ユーティリティ
│   ├── messageFormatter.ts   # メッセージ分割
│   └── streak.ts             # ストリーク計算
└── index.ts                  # Cloud Functions エントリーポイント
```
