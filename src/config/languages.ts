import { NudgeType } from "../prompts/pushMessages";

export type TargetLanguage = "en" | "es";

/** Language-specific UI strings (shown to users in Japanese) */
export interface LanguageStrings {
  // Bot identity
  botName: string;
  targetLanguageName: string; // e.g. "英語", "スペイン語"

  // LINE credential secret names
  lineChannelSecret: string;
  lineChannelAccessToken: string;

  // Speech-to-text language code
  speechLanguageCode: string;

  // Firestore collection prefix (users vs usersEs)
  usersCollection: string;

  // Welcome message
  welcomeMessage: string;

  // Commands
  commands: {
    notifOff: string;
    notifOn: string;
    levelCheck: string;
    help: string;
    pushTimePattern: RegExp;
    pushTimeErrorReply: string;
    pushTimeSuccessReply: (time: string) => string;
    notifOffReply: string;
    notifOnReply: (time: string) => string;
    levelCheckReply: (level: string, streak: number, totalChats: number) => string;
    helpReply: string;
  };

  // Text chat messages
  firstChatHint: string;
  voicePromptMessage: string;

  // Voice chat messages
  voiceTooLongMessage: string;
  voiceNotRecognizedMessage: string;

  // Rate limit messages
  rateLimitFreeText: (max: number) => string;
  rateLimitProText: (max: number, voiceRemaining: number) => string;
  rateLimitFreeVoice: string;
  rateLimitProVoice: (max: number, textRemaining: number) => string;

  // Error messages
  errorAbort: string;
  errorRateLimit: string;
  errorGeneric: string;

  // Milestone messages
  milestones: {
    firstChat: string;
    streak3: string;
    streak7: string;
    streak14: string;
    streak30: string;
    total10: string;
    total30: string;
    total50: string;
    total100: string;
    firstVoice: string;
  };

  // Weekly report header
  weeklyReportHeader: (textCount: number, voiceCount: number, activeDays: number, streak: number) => string;

  // Churn detection
  churnDaysLabel: string;
  churnAlertHeader: (date: string, days: number) => string;

  // Nudge messages
  nudgeMessages: Record<NudgeType, string[]>;
}

const EN_STRINGS: LanguageStrings = {
  botName: "AI English Coach",
  targetLanguageName: "英語",

  lineChannelSecret: "LINE_CHANNEL_SECRET",
  lineChannelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",

  speechLanguageCode: "en-US",
  usersCollection: "users",

  welcomeMessage:
    "はじめまして！AI English Coach です 🎓\n" +
    "通訳ガイドの英語力アップをお手伝いします。\n\n" +
    "このBotでできること：\n" +
    "📝 英文を送ると → 添削＋ガイド向け表現を提案\n" +
    "🎤 音声を送ると → 発音チェック＋改善ポイント\n" +
    "📊 毎週日曜に → 学習レポートをお届け\n\n" +
    "さっそく始めましょう！\n" +
    "まずは英語であなたの自己紹介をしてください。\n" +
    '"Hi, I\'m [名前]. I\'ve been a tour guide for [X] years."\n\n' +
    "【コマンド】\n" +
    "・通知オン / 通知オフ\n" +
    "・通知設定 HH:MM（例: 通知設定 21:00）\n" +
    "・レベル確認\n" +
    "・ヘルプ",

  commands: {
    notifOff: "通知オフ",
    notifOn: "通知オン",
    levelCheck: "レベル確認",
    help: "ヘルプ",
    pushTimePattern: /^通知設定\s+(\d{1,2}):(\d{2})$/,
    pushTimeErrorReply: "時刻の形式が正しくありません。例: 通知設定 08:00",
    pushTimeSuccessReply: (time: string) => `通知時間を ${time} に変更しました`,
    notifOffReply: "通知をオフにしました",
    notifOnReply: (time: string) => `通知をオンにしました。毎日${time}に届きます`,
    levelCheckReply: (level: string, streak: number, totalChats: number) =>
      `レベル: ${level}\n連続学習: ${streak}日\n累計チャット: ${totalChats}回`,
    helpReply:
      "【使い方】\n" +
      "・英文を送ると添削します\n" +
      "・音声メッセージもOKです🎤\n" +
      "・日本語で質問もできます\n\n" +
      "【コマンド】\n" +
      "・通知オン / 通知オフ\n" +
      "・通知設定 HH:MM（例: 通知設定 21:00）\n" +
      "・レベル確認\n" +
      "・ヘルプ",
  },

  firstChatHint:
    "\n\n──────\n" +
    "💡 ヒント: 毎朝、今日の練習問題が届きます。\n" +
    "通知時間の変更は「通知設定 08:00」のように送ってください。",
  voicePromptMessage:
    "\n\n──────\n" +
    "🎤 テキストでの練習、順調ですね！\n" +
    "次は同じ内容を音声で言ってみましょう。\n" +
    "通訳ガイドは「話す力」が最重要です！",

  voiceTooLongMessage: "音声メッセージは3分以内でお願いします",
  voiceNotRecognizedMessage: "音声が聞き取れませんでした。もう少しはっきり話してみてください",

  rateLimitFreeText: (max: number) =>
    `本日の練習（${max}回）おつかれさまでした！\n` +
    "今日学んだ表現を実際のガイドで使ってみてください。\n\n" +
    "もっと練習したい方はBot Proプランで1日20回まで利用できます。",
  rateLimitProText: (max: number, voiceRemaining: number) =>
    `本日のテキスト（${max}回）おつかれさまでした！` +
    (voiceRemaining > 0
      ? `\nボイスチャットはあと${voiceRemaining}回使えます🎤`
      : "\n今日もたくさん練習しましたね。また明日お話ししましょう！"),
  rateLimitFreeVoice:
    "音声練習はBot Proプランで利用できます。\n" +
    "テキストで英文を送ると添削します📝",
  rateLimitProVoice: (max: number, textRemaining: number) =>
    `本日のボイス（${max}回）おつかれさまでした！` +
    (textRemaining > 0
      ? `\nテキストチャットはあと${textRemaining}回使えます💬`
      : "\n今日もたくさん練習しましたね。また明日お話ししましょう！"),

  errorAbort: "少々お待ちください…もう一度お試しいただけますか？",
  errorRateLimit: "ただいま混み合っています。1分後にもう一度お試しください。",
  errorGeneric: "すみません、一時的にエラーが発生しました。もう一度お試しください。",

  milestones: {
    firstChat: "🎉 最初の一歩を踏み出しました！毎日少しずつ続けていきましょう！",
    streak3: "🔥 3日連続達成！いい調子です！",
    streak7: "⭐ 1週間連続達成！習慣化の第一歩です！",
    streak14: "🌟 2週間連続達成！英語が習慣になってきましたね！",
    streak30: "🏆 30日連続達成！素晴らしい継続力です！",
    total10: "📚 10回達成！着実に前進しています！",
    total30: "💪 30回達成！表現の幅が広がってきましたね！",
    total50: "🎯 50回達成！ガイドの英語力が確実にアップしています！",
    total100: "💯 チャット100回突破！確実に力がついています！",
    firstVoice: "🎤 初めての音声練習クリア！話す力が伸びます！",
  },

  weeklyReportHeader: (textCount, voiceCount, activeDays, streak) =>
    `📊 今週の振り返り\n` +
    `テキスト: ${textCount}回\n` +
    `音声: ${voiceCount}回\n` +
    `学習日数: ${activeDays}/7\n` +
    `ストリーク: ${streak}日\n\n`,

  churnDaysLabel: "日間未学習",
  churnAlertHeader: (date, days) =>
    `⚠️ 離脱リスクアラート（${date}）\n\n` +
    `${days}日以上未学習のBot Proユーザー:\n`,

  nudgeMessages: {
    gentle_nudge: [
      "昨日はお休みでしたね。今日は1問だけ挑戦してみませんか？ 💪",
      "少しだけ英語に触れてみませんか？ 今日のお題です👇",
    ],
    strong_nudge: [
      "しばらく間が空きましたね。短い1問から再開しましょう！ 🔄",
      "お久しぶりです！リハビリがてら、軽い問題からどうですか？ 👋",
    ],
    streak_boost: [
      "連続学習が続いています！今日も1問チャレンジして記録を伸ばしましょう 🔥",
      "ストリーク継続中！この調子で今日もやってみましょう 🎯",
    ],
  },
};

const ES_STRINGS: LanguageStrings = {
  botName: "AI Spanish Coach",
  targetLanguageName: "スペイン語",

  lineChannelSecret: "LINE_CHANNEL_SECRET_ES",
  lineChannelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN_ES",

  speechLanguageCode: "es-ES",
  usersCollection: "usersEs",

  welcomeMessage:
    "はじめまして！AI Spanish Coach です 🎓\n" +
    "スペイン語力アップをお手伝いします。\n\n" +
    "このBotでできること：\n" +
    "📝 スペイン語文を送ると → 添削＋自然な表現を提案\n" +
    "🎤 音声を送ると → 発音チェック＋改善ポイント\n" +
    "📊 毎週日曜に → 学習レポートをお届け\n\n" +
    "さっそく始めましょう！\n" +
    "まずはスペイン語であなたの自己紹介をしてください。\n" +
    '"Hola, me llamo [名前]. Estudio español desde hace [X] años."\n\n' +
    "【コマンド】\n" +
    "・通知オン / 通知オフ\n" +
    "・通知設定 HH:MM（例: 通知設定 21:00）\n" +
    "・レベル確認\n" +
    "・ヘルプ",

  commands: {
    notifOff: "通知オフ",
    notifOn: "通知オン",
    levelCheck: "レベル確認",
    help: "ヘルプ",
    pushTimePattern: /^通知設定\s+(\d{1,2}):(\d{2})$/,
    pushTimeErrorReply: "時刻の形式が正しくありません。例: 通知設定 08:00",
    pushTimeSuccessReply: (time: string) => `通知時間を ${time} に変更しました`,
    notifOffReply: "通知をオフにしました",
    notifOnReply: (time: string) => `通知をオンにしました。毎日${time}に届きます`,
    levelCheckReply: (level: string, streak: number, totalChats: number) =>
      `レベル: ${level}\n連続学習: ${streak}日\n累計チャット: ${totalChats}回`,
    helpReply:
      "【使い方】\n" +
      "・スペイン語文を送ると添削します\n" +
      "・音声メッセージもOKです🎤\n" +
      "・日本語で質問もできます\n\n" +
      "【コマンド】\n" +
      "・通知オン / 通知オフ\n" +
      "・通知設定 HH:MM（例: 通知設定 21:00）\n" +
      "・レベル確認\n" +
      "・ヘルプ",
  },

  firstChatHint:
    "\n\n──────\n" +
    "💡 ヒント: 毎朝、今日の練習問題が届きます。\n" +
    "通知時間の変更は「通知設定 08:00」のように送ってください。",
  voicePromptMessage:
    "\n\n──────\n" +
    "🎤 テキストでの練習、順調ですね！\n" +
    "次は同じ内容を音声で言ってみましょう。\n" +
    "スペイン語は「話す力」が最重要です！",

  voiceTooLongMessage: "音声メッセージは3分以内でお願いします",
  voiceNotRecognizedMessage: "音声が聞き取れませんでした。もう少しはっきり話してみてください",

  rateLimitFreeText: (max: number) =>
    `本日の無料プランのテキスト上限（${max}回）に達しました。\n` +
    "Bot Proプランにアップグレードすると、1日20回まで利用できます。",
  rateLimitProText: (max: number, voiceRemaining: number) =>
    `本日のテキスト上限（${max}回）に達しました。` +
    (voiceRemaining > 0
      ? `\nボイスチャットはあと${voiceRemaining}回使えます🎤`
      : "\nボイスチャットも上限に達しています。また明日お話ししましょう！"),
  rateLimitFreeVoice:
    "音声練習はBot Proプランで利用できます。\n" +
    "テキストでスペイン語文を送ると添削します📝",
  rateLimitProVoice: (max: number, textRemaining: number) =>
    `本日のボイス上限（${max}回）に達しました。` +
    (textRemaining > 0
      ? `\nテキストチャットはあと${textRemaining}回使えます💬`
      : "\nテキストチャットも上限に達しています。また明日お話ししましょう！"),

  errorAbort: "少々お待ちください…もう一度お試しいただけますか？",
  errorRateLimit: "ただいま混み合っています。1分後にもう一度お試しください。",
  errorGeneric: "すみません、一時的にエラーが発生しました。もう一度お試しください。",

  milestones: {
    firstChat: "🎉 最初の一歩を踏み出しました！毎日少しずつ続けていきましょう！",
    streak3: "🔥 3日連続達成！いい調子です！",
    streak7: "⭐ 1週間連続達成！習慣化の第一歩です！",
    streak14: "🌟 2週間連続達成！英語が習慣になってきましたね！",
    streak30: "🏆 30日連続達成！素晴らしい継続力です！",
    total10: "📚 10回達成！着実に前進しています！",
    total30: "💪 30回達成！表現の幅が広がってきましたね！",
    total50: "🎯 50回達成！ガイドの英語力が確実にアップしています！",
    total100: "💯 チャット100回突破！確実に力がついています！",
    firstVoice: "🎤 初めての音声練習クリア！話す力が伸びます！",
  },

  weeklyReportHeader: (textCount, voiceCount, activeDays, streak) =>
    `📊 今週の振り返り\n` +
    `テキスト: ${textCount}回\n` +
    `音声: ${voiceCount}回\n` +
    `学習日数: ${activeDays}/7\n` +
    `ストリーク: ${streak}日\n\n`,

  churnDaysLabel: "日間未学習",
  churnAlertHeader: (date, days) =>
    `⚠️ 離脱リスクアラート（${date}）\n\n` +
    `${days}日以上未学習のBot Proユーザー:\n`,

  nudgeMessages: {
    gentle_nudge: [
      "昨日はお休みでしたね。今日は1問だけ挑戦してみませんか？ 💪",
      "少しだけスペイン語に触れてみませんか？ 今日のお題です👇",
    ],
    strong_nudge: [
      "しばらく間が空きましたね。短い1問から再開しましょう！ 🔄",
      "お久しぶりです！リハビリがてら、軽い問題からどうですか？ 👋",
    ],
    streak_boost: [
      "連続学習が続いています！今日も1問チャレンジして記録を伸ばしましょう 🔥",
      "ストリーク継続中！この調子で今日もやってみましょう 🎯",
    ],
  },
};

const LANGUAGE_MAP: Record<TargetLanguage, LanguageStrings> = {
  en: EN_STRINGS,
  es: ES_STRINGS,
};

export function getLangStrings(lang: TargetLanguage): LanguageStrings {
  return LANGUAGE_MAP[lang];
}
