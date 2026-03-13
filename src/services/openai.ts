import OpenAI, { toFile } from "openai";
import { getSecret } from "../config/secrets";
import {
  OPENAI_MAX_TOKENS,
  OPENAI_TIMEOUT_MS,
  MAX_RETRIES,
} from "../config/constants";

let client: OpenAI | null = null;

async function getClient(): Promise<OpenAI> {
  if (!client) {
    const apiKey = await getSecret("OPENAI_API_KEY");
    client = new OpenAI({ apiKey, timeout: OPENAI_TIMEOUT_MS });
  }
  return client;
}

function isRetryable(err: unknown): boolean {
  if (err instanceof OpenAI.APIError) {
    return err.status === 429 || err.status === 500 || err.status === 503;
  }
  if (err instanceof Error && err.name === "AbortError") {
    return true;
  }
  return false;
}

function getRetryAfterMs(err: unknown): number | null {
  if (err instanceof OpenAI.APIError && err.status === 429) {
    const header = err.headers?.["retry-after"];
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
  const openai = await getClient();
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: messages as OpenAI.ChatCompletionMessageParam[],
        max_tokens: maxTokens ?? OPENAI_MAX_TOKENS,
        temperature: 0.7,
      });

      const choice = response.choices[0];
      return {
        text: choice?.message?.content ?? "",
        usage: {
          promptTokens: response.usage?.prompt_tokens ?? 0,
          completionTokens: response.usage?.completion_tokens ?? 0,
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
  audioBuffer: Buffer
): Promise<string> {
  const openai = await getClient();
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const file = await toFile(audioBuffer, "audio.m4a", {
        type: "audio/m4a",
      });
      const response = await openai.audio.transcriptions.create({
        model: "whisper-1",
        file,
        language: "en",
      });
      return response.text;
    } catch (err) {
      lastError = err;
      if (!isRetryable(err) || attempt === MAX_RETRIES - 1) {
        break;
      }
      const backoffMs = 1000 * Math.pow(2, attempt);
      await sleep(backoffMs);
    }
  }

  throw lastError;
}
