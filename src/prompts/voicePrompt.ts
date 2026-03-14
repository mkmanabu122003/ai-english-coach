import { TargetLanguage } from "../config/languages";

const VOICE_ADDITION_EN = `The user sent a voice message. Below is the Whisper transcription.
Format:
🎤 あなたの発言: "[transcription]"
✅ 良い点: [1-2 concrete positives]
📝 改善ポイント: [1-3 corrections, before → after]
💡 こう言うともっと自然: "[full improved version]"
Keep under 500 characters.`;

const VOICE_ADDITION_ES = `The user sent a voice message in Spanish. Below is the speech-to-text transcription.
Format:
🎤 あなたの発言: "[transcription]"
✅ 良い点: [1-2 concrete positives about their Spanish]
📝 改善ポイント: [1-3 corrections, before → after]
💡 こう言うともっと自然: "[full improved version in Spanish]"
Keep under 500 characters.`;

export function getVoiceAddition(lang: TargetLanguage = "en"): string {
  return lang === "es" ? VOICE_ADDITION_ES : VOICE_ADDITION_EN;
}

/** @deprecated Use getVoiceAddition() instead */
export const VOICE_ADDITION = VOICE_ADDITION_EN;
