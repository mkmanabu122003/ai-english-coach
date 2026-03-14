/**
 * Migration script to populate Firestore with questions and nudge messages
 * from the source code's QUESTION_POOL / QUESTION_POOL_ES and language config.
 *
 * Usage:
 *   npx ts-node scripts/migrateQuestions.ts
 *
 * Before running, set GOOGLE_APPLICATION_CREDENTIALS to your service account key.
 */

import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import {
  QUESTION_POOL,
  QUESTION_POOL_ES,
} from "../src/prompts/pushMessages";
import { getLangStrings } from "../src/config/languages";
import type { TargetLanguage } from "../src/config/languages";

admin.initializeApp();
const db = admin.firestore();

async function migrateQuestions(): Promise<void> {
  console.log("--- Migrating Questions ---");

  // English questions
  let created = 0;
  for (const q of QUESTION_POOL) {
    const docRef = db.collection("questions").doc(q.id);
    const existing = await docRef.get();
    if (existing.exists) {
      console.log(`  Skipping ${q.id} (already exists)`);
      continue;
    }

    await docRef.set({
      id: q.id,
      category: q.category,
      level: q.level,
      question: q.question,
      language: "en" as TargetLanguage,
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    created++;
  }
  console.log(`  EN questions: created ${created} / ${QUESTION_POOL.length}`);

  // Spanish questions
  created = 0;
  for (const q of QUESTION_POOL_ES) {
    const docRef = db.collection("questions").doc(q.id);
    const existing = await docRef.get();
    if (existing.exists) {
      console.log(`  Skipping ${q.id} (already exists)`);
      continue;
    }

    await docRef.set({
      id: q.id,
      category: q.category,
      level: q.level,
      question: q.question,
      language: "es" as TargetLanguage,
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    created++;
  }
  console.log(
    `  ES questions: created ${created} / ${QUESTION_POOL_ES.length}`
  );
}

async function migrateNudgeMessages(): Promise<void> {
  console.log("--- Migrating Nudge Messages ---");

  const languages: TargetLanguage[] = ["en", "es"];
  const nudgeTypes = [
    "gentle_nudge",
    "strong_nudge",
    "streak_boost",
  ] as const;

  for (const lang of languages) {
    const strings = getLangStrings(lang);
    let created = 0;

    for (const type of nudgeTypes) {
      const messages = strings.nudgeMessages[type];
      for (let i = 0; i < messages.length; i++) {
        const text = messages[i];
        const docId = `${lang}_${type}_${i + 1}`;
        const docRef = db.collection("nudgeMessages").doc(docId);
        const existing = await docRef.get();

        if (existing.exists) {
          console.log(`  Skipping ${docId} (already exists)`);
          continue;
        }

        await docRef.set({
          id: docId,
          type,
          language: lang,
          text,
          isActive: true,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        created++;
      }
    }

    console.log(`  ${lang.toUpperCase()} nudge messages: created ${created}`);
  }
}

async function main(): Promise<void> {
  await migrateQuestions();
  await migrateNudgeMessages();
  console.log("\nMigration complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
