import crypto from "crypto";
import { messagingApi } from "@line/bot-sdk";
import { getSecret } from "../config/secrets";
import { splitMessage } from "../utils/messageFormatter";
import { TargetLanguage, getLangStrings } from "../config/languages";

const clients = new Map<string, messagingApi.MessagingApiClient>();
const blobClients = new Map<string, messagingApi.MessagingApiBlobClient>();

async function getClient(lang: TargetLanguage = "en"): Promise<messagingApi.MessagingApiClient> {
  const strings = getLangStrings(lang);
  const key = strings.lineChannelAccessToken;
  let client = clients.get(key);
  if (!client) {
    const token = await getSecret(key);
    client = new messagingApi.MessagingApiClient({
      channelAccessToken: token,
    });
    clients.set(key, client);
  }
  return client;
}

async function getBlobClient(lang: TargetLanguage = "en"): Promise<messagingApi.MessagingApiBlobClient> {
  const strings = getLangStrings(lang);
  const key = strings.lineChannelAccessToken;
  let blobClient = blobClients.get(key);
  if (!blobClient) {
    const token = await getSecret(key);
    blobClient = new messagingApi.MessagingApiBlobClient({
      channelAccessToken: token,
    });
    blobClients.set(key, blobClient);
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
  text: string,
  lang: TargetLanguage = "en"
): Promise<void> {
  const api = await getClient(lang);
  const chunks = splitMessage(text);
  await api.replyMessage({
    replyToken,
    messages: chunks.map((chunk) => ({ type: "text", text: chunk })),
  });
}

export async function pushText(
  userId: string,
  text: string,
  lang: TargetLanguage = "en"
): Promise<void> {
  const api = await getClient(lang);
  const chunks = splitMessage(text);
  await api.pushMessage({
    to: userId,
    messages: chunks.map((chunk) => ({ type: "text", text: chunk })),
  });
}

export async function getProfile(
  userId: string,
  lang: TargetLanguage = "en"
): Promise<{ displayName: string }> {
  const api = await getClient(lang);
  const profile = await api.getProfile(userId);
  return { displayName: profile.displayName };
}

export async function getContent(messageId: string, lang: TargetLanguage = "en"): Promise<Buffer> {
  const blob = await getBlobClient(lang);
  const stream = await blob.getMessageContent(messageId);
  const chunks: Buffer[] = [];
  for await (const chunk of stream as AsyncIterable<Buffer>) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
