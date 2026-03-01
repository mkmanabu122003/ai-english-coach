import crypto from "crypto";
import { messagingApi } from "@line/bot-sdk";
import { getSecret } from "../config/secrets";
import { splitMessage } from "../utils/messageFormatter";

let client: messagingApi.MessagingApiClient | null = null;
let blobClient: messagingApi.MessagingApiBlobClient | null = null;

async function getClient(): Promise<messagingApi.MessagingApiClient> {
  if (!client) {
    const token = await getSecret("LINE_CHANNEL_ACCESS_TOKEN");
    client = new messagingApi.MessagingApiClient({
      channelAccessToken: token,
    });
  }
  return client;
}

async function getBlobClient(): Promise<messagingApi.MessagingApiBlobClient> {
  if (!blobClient) {
    const token = await getSecret("LINE_CHANNEL_ACCESS_TOKEN");
    blobClient = new messagingApi.MessagingApiBlobClient({
      channelAccessToken: token,
    });
  }
  return blobClient;
}

export function validateSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const digest = crypto
    .createHmac("SHA256", secret)
    .update(body)
    .digest();
  const sigBuffer = Buffer.from(signature, "base64");
  if (digest.length !== sigBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(digest, sigBuffer);
}

export async function replyText(
  replyToken: string,
  text: string
): Promise<void> {
  const api = await getClient();
  const chunks = splitMessage(text);
  await api.replyMessage({
    replyToken,
    messages: chunks.map((chunk) => ({ type: "text", text: chunk })),
  });
}

export async function pushText(
  userId: string,
  text: string
): Promise<void> {
  const api = await getClient();
  const chunks = splitMessage(text);
  await api.pushMessage({
    to: userId,
    messages: chunks.map((chunk) => ({ type: "text", text: chunk })),
  });
}

export async function getProfile(
  userId: string
): Promise<{ displayName: string }> {
  const api = await getClient();
  const profile = await api.getProfile(userId);
  return { displayName: profile.displayName };
}

export async function getContent(messageId: string): Promise<Buffer> {
  const blob = await getBlobClient();
  const stream = await blob.getMessageContent(messageId);
  const chunks: Buffer[] = [];
  for await (const chunk of stream as AsyncIterable<Buffer>) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
