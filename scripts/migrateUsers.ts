/**
 * One-time migration script to add new fields to existing users.
 *
 * Usage:
 *   npx ts-node scripts/migrateUsers.ts
 *
 * Before running, set GOOGLE_APPLICATION_CREDENTIALS to your service account key.
 */

import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

admin.initializeApp();
const db = admin.firestore();

async function migrateCollection(collectionName: string): Promise<void> {
  console.log(`Migrating collection: ${collectionName}`);
  const snap = await db.collection(collectionName).get();
  let updated = 0;

  for (const doc of snap.docs) {
    const data = doc.data();

    // Skip if already migrated
    if (data.onboardingStatus !== undefined) {
      continue;
    }

    const updates: Record<string, unknown> = {
      healthScore: 0,
      onboardingStatus: {
        firstText: (data.totalChats ?? 0) > 0,
        levelSet: data.englishLevel !== "unset" && data.englishLevel !== undefined,
        pushTimeSet: data.pushTime !== "08:00",
        firstVoice: (data.totalVoice ?? 0) > 0,
        streak3: (data.longestStreak ?? 0) >= 3,
      },
      levelHistory: [],
      planHistory: [{ plan: data.plan ?? "free", changedAt: data.createdAt ?? FieldValue.serverTimestamp() }],
      interventions: [],
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Set plan/language defaults if missing
    if (data.plan === undefined) {
      updates.plan = "free";
    }
    if (data.language === undefined) {
      updates.language = collectionName === "usersEs" ? "es" : "en";
    }

    await doc.ref.update(updates);
    updated++;
  }

  console.log(`  Updated ${updated} / ${snap.size} users`);
}

async function main(): Promise<void> {
  await migrateCollection("users");
  await migrateCollection("usersEs");
  console.log("Migration complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
