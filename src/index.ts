import { onRequest } from "firebase-functions/v2/https";
import { initializeFirestore } from "./services/firestore";
import { webhookHandler } from "./handlers/webhook";

initializeFirestore();

export const webhook = onRequest(
  {
    region: "asia-northeast1",
    timeoutSeconds: 60,
    memory: "256MiB",
    maxInstances: 50,
    concurrency: 80,
  },
  webhookHandler
);
