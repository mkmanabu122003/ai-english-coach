import Anthropic from "@anthropic-ai/sdk";
import speech from "@google-cloud/speech";
import { getSecret } from "../config/secrets";
import {
  AI_MAX_TOKENS,
  AI_TIMEOUT_MS,
  MAX_RETRIES,
} from "../config/constants";

let client: Anthropic | null = null;

async function getClient(): Promise<Anthropic> {
  if (!client) {
    const apiKey = await getSecret("ANTHROPIC_API_KEY");
    client = new Anthropic({ apiKey, timeout: AI_TIMEOUT_MS });
  }
  return client;
}

function isRetryable(err: unknown): boolean {
  if (err instanceof Anthropic.APIError) {
    return err.status === 429 || err.status === 500 || err.status === 529;
  }
  if (err instanceof Error && err.name === "AbortError") {
    return true;
  }
  return false;
}

function getRetryAfterMs(err: unknown): number | null {
  if (err instanceof Anthropic.APIError && err.status === 429) {
    const header = (err.headers as Record<string, string>)?.["retry-after"];
    if (header) {
      const seconds = Number(header);
      if (!Number.isNaN(seconds)) {
        return seconds * 1000;
      }
    }
  }
  return null;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface ChatCompletionResult {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
  };
}

export async function chatCompletion(
  messages: Array<{ role: string; content: string }>,
  maxTokens?: number
): Promise<ChatCompletionResult> {
  const anthropic = await getClient();
  let lastError: unknown;

  // Separate system message from conversation messages
  const systemMessage = messages.find((m) => m.role === "system");
  const conversationMessages = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        system: systemMessage?.content,
        messages: conversationMessages,
        max_tokens: maxTokens ?? AI_MAX_TOKENS,
        temperature: 0.7,
      });

      const textBlock = response.content.find((b) => b.type === "text");
      return {
        text: textBlock?.type === "text" ? textBlock.text : "",
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
        },
      };
    } catch (err) {
      lastError = err;
      if (!isRetryable(err) || attempt === MAX_RETRIES - 1) {
        break;
      }
      const retryAfter = getRetryAfterMs(err);
      const backoffMs = retryAfter ?? 1000 * Math.pow(2, attempt);
      await sleep(backoffMs);
    }
  }

  throw lastError;
}

export async function transcribeAudio(
  audioBuffer: Buffer,
  languageCode: string = "en-US"
): Promise<string> {
  const speechClient = new speech.SpeechClient();
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const audioBytes = audioBuffer.toString("base64");
      const [response] = await speechClient.recognize({
        audio: { content: audioBytes },
        config: {
          encoding: "OGG_OPUS" as const,
          sampleRateHertz: 16000,
          languageCode,
          model: "latest_long",
          enableAutomaticPunctuation: true,
        },
      });

      const transcription = response.results
        ?.map((result) => result.alternatives?.[0]?.transcript)
        .filter(Boolean)
        .join(" ");

      return transcription ?? "";
    } catch (err) {
      lastError = err;
      if (attempt === MAX_RETRIES - 1) {
        break;
      }
      const backoffMs = 1000 * Math.pow(2, attempt);
      await sleep(backoffMs);
    }
  }

  throw lastError;
}
