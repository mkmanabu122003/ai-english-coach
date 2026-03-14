/**
 * Set Firebase Auth custom claims for admin users.
 *
 * Usage:
 *   npx ts-node scripts/setAdminClaim.ts <email> [role]
 *
 * Examples:
 *   npx ts-node scripts/setAdminClaim.ts admin@example.com admin
 *   npx ts-node scripts/setAdminClaim.ts instructor@example.com instructor
 *
 * Before running, set GOOGLE_APPLICATION_CREDENTIALS to your service account key.
 */

import * as admin from "firebase-admin";

admin.initializeApp();

async function main(): Promise<void> {
  const email = process.argv[2];
  const role = process.argv[3] || "admin";

  if (!email) {
    console.error("Usage: npx ts-node scripts/setAdminClaim.ts <email> [role]");
    console.error("  role: admin (default) or instructor");
    process.exit(1);
  }

  if (role !== "admin" && role !== "instructor") {
    console.error("Role must be 'admin' or 'instructor'");
    process.exit(1);
  }

  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { role });
    console.log(`Set custom claim { role: "${role}" } for user ${email} (uid: ${user.uid})`);
  } catch (err) {
    console.error("Failed to set custom claims:", err);
    process.exit(1);
  }

  process.exit(0);
}

main();
