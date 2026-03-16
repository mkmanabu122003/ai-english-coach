import { onRequest, Request } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { Response } from "express";
import { initializeFirestore } from "./services/firestore";
import { createWebhookHandler } from "./handlers/webhook";
import {
  dailyPush as dailyPushHandler,
  weeklyReport as weeklyReportHandler,
  churnDetection as churnDetectionHandler,
} from "./handlers/scheduler";
import { generateDailyStats } from "./services/statsService";

initializeFirestore();

// ── English Bot ──

export const webhook = onRequest(
  {
    region: "asia-northeast1",
    timeoutSeconds: 60,
    memory: "256MiB",
    maxInstances: 50,
    concurrency: 80,
  },
  createWebhookHandler("en")
);

// ── Spanish Bot ──

export const webhookEs = onRequest(
  {
    region: "asia-northeast1",
    timeoutSeconds: 60,
    memory: "256MiB",
    maxInstances: 50,
    concurrency: 80,
  },
  createWebhookHandler("es")
);

// ── Shared helpers ──

function hasOidcToken(req: Request): boolean {
  const auth = req.headers.authorization;
  return typeof auth === "string" && auth.startsWith("Bearer ");
}

// ── Scheduler endpoints (run for both languages) ──

export const dailyPush = onRequest(
  {
    region: "asia-northeast1",
    timeoutSeconds: 300,
    memory: "256MiB",
    maxInstances: 1,
  },
  async (req: Request, res: Response) => {
    if (!hasOidcToken(req)) {
      res.status(401).send("Unauthorized");
      return;
    }
    await Promise.all([
      dailyPushHandler("en"),
      dailyPushHandler("es"),
    ]);
    res.status(200).send("OK");
  }
);

export const weeklyReport = onRequest(
  {
    region: "asia-northeast1",
    timeoutSeconds: 540,
    memory: "512MiB",
    maxInstances: 1,
  },
  async (req: Request, res: Response) => {
    if (!hasOidcToken(req)) {
      res.status(401).send("Unauthorized");
      return;
    }
    await Promise.all([
      weeklyReportHandler("en"),
      weeklyReportHandler("es"),
    ]);
    res.status(200).send("OK");
  }
);

export const churnDetection = onRequest(
  {
    region: "asia-northeast1",
    timeoutSeconds: 120,
    memory: "256MiB",
    maxInstances: 1,
  },
  async (req: Request, res: Response) => {
    if (!hasOidcToken(req)) {
      res.status(401).send("Unauthorized");
      return;
    }
    await Promise.all([
      churnDetectionHandler("en"),
      churnDetectionHandler("es"),
    ]);
    res.status(200).send("OK");
  }
);

// ── Daily Stats Batch ──

// HTTP endpoint for manual trigger
export const dailyStats = onRequest(
  {
    region: "asia-northeast1",
    timeoutSeconds: 540,
    memory: "512MiB",
    maxInstances: 1,
  },
  async (req: Request, res: Response) => {
    if (!hasOidcToken(req)) {
      res.status(401).send("Unauthorized");
      return;
    }
    await generateDailyStats();
    res.status(200).send("OK");
  }
);

// Scheduled: run daily at 00:05 JST (15:05 UTC)
export const scheduledDailyStats = onSchedule(
  {
    schedule: "5 0 * * *",
    timeZone: "Asia/Tokyo",
    region: "asia-northeast1",
    timeoutSeconds: 540,
    memory: "512MiB",
    maxInstances: 1,
  },
  async () => {
    await generateDailyStats();
  }
);
