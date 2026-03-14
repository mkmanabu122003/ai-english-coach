import { onRequest, Request } from "firebase-functions/v2/https";
import { Response } from "express";
import { initializeFirestore } from "./services/firestore";
import { webhookHandler } from "./handlers/webhook";
import {
  dailyPush as dailyPushHandler,
  weeklyReport as weeklyReportHandler,
  churnDetection as churnDetectionHandler,
} from "./handlers/scheduler";

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

function hasOidcToken(req: Request): boolean {
  const auth = req.headers.authorization;
  return typeof auth === "string" && auth.startsWith("Bearer ");
}

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
    await dailyPushHandler();
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
    await weeklyReportHandler();
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
    await churnDetectionHandler();
    res.status(200).send("OK");
  }
);
