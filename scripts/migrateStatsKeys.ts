/**
 * Migration script to convert flat dot-notation keys in daily stats
 * to proper nested objects.
 *
 * Before this fix, incrementDailyStat() used set() with merge:true and
 * dot-notation keys (e.g. "textChats.en"), which created flat field names
 * instead of nested objects ({ textChats: { en: ... } }).
 *
 * This script reads all stats/daily/dates/* documents, detects flat keys,
 * converts them to nested structure, and removes the flat keys.
 *
 * Usage:
 *   npx ts-node scripts/migrateStatsKeys.ts
 *
 * Before running, set GOOGLE_APPLICATION_CREDENTIALS to your service account key.
 */

import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const projectId = process.env.GCP_PROJECT_ID || "ai-english-coach-bot";
admin.initializeApp({ projectId });
const db = admin.firestore();

// Fields that incrementDailyStat writes with dot notation
const KNOWN_FIELDS = [
  "dau",
  "textChats",
  "voiceChats",
  "newFollows",
  "unfollows",
  "rateLimitHits",
  "firstChatUsers",
  "promptTokens",
  "completionTokens",
  "proConversions",
];

const KNOWN_LANGS = ["en", "es"];

async function migrateStats(): Promise<void> {
  const snapshot = await db
    .collection("stats")
    .doc("daily")
    .collection("dates")
    .get();

  console.log(`Found ${snapshot.size} daily stats documents`);
  let migrated = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const flatKeys: string[] = [];
    const nested: Record<string, Record<string, number>> = {};

    // Find flat dot-notation keys
    for (const key of Object.keys(data)) {
      for (const field of KNOWN_FIELDS) {
        for (const lang of KNOWN_LANGS) {
          if (key === `${field}.${lang}`) {
            flatKeys.push(key);
            if (!nested[field]) {
              nested[field] = {};
            }
            // Merge with existing nested value if present
            const existingNested = data[field] as Record<string, number> | undefined;
            const existingValue = existingNested?.[lang] ?? 0;
            nested[field][lang] = (data[key] as number) + existingValue;
          }
        }
      }
    }

    if (flatKeys.length === 0) {
      continue;
    }

    // Build update: set nested fields and delete flat keys
    const updates: Record<string, unknown> = {};
    for (const [field, langValues] of Object.entries(nested)) {
      for (const [lang, value] of Object.entries(langValues)) {
        updates[`${field}.${lang}`] = value;
      }
    }
    for (const key of flatKeys) {
      updates[key] = FieldValue.delete();
    }

    // update() interprets dot-notation as field paths (nested),
    // while flat keys with dots are matched literally for deletion
    // We need two operations: update for nested, set for deletion
    console.log(`  ${doc.id}: migrating ${flatKeys.length} flat keys → ${Object.keys(nested).join(", ")}`);

    // Step 1: Write nested fields using update() with dot-notation paths
    const nestedUpdates: Record<string, number> = {};
    for (const [field, langValues] of Object.entries(nested)) {
      for (const [lang, value] of Object.entries(langValues)) {
        nestedUpdates[`${field}.${lang}`] = value;
      }
    }
    await doc.ref.update(nestedUpdates);

    // Step 2: Delete flat keys by reconstructing the doc without them
    // FieldValue.delete() with update() would interpret "textChats.en" as
    // a nested path and delete the nested field we just wrote.
    // Instead, get fresh doc, remove flat keys, and overwrite.
    const freshDoc = await doc.ref.get();
    const freshData = freshDoc.data()!;
    const cleanData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(freshData)) {
      if (!flatKeys.includes(key)) {
        cleanData[key] = value;
      }
    }
    await doc.ref.set(cleanData);

    migrated++;
  }

  console.log(`\nMigration complete: ${migrated} / ${snapshot.size} documents updated`);
}

migrateStats()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
