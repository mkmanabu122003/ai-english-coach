import * as admin from "firebase-admin";

function getApp(): admin.app.App {
  if (admin.apps.length === 0) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccount) {
      const decoded = JSON.parse(
        Buffer.from(serviceAccount, "base64").toString("utf-8")
      );
      admin.initializeApp({
        credential: admin.credential.cert(decoded),
      });
    } else {
      admin.initializeApp();
    }
  }
  return admin.apps[0]!;
}

export function getAdminDb(): FirebaseFirestore.Firestore {
  return getApp().firestore();
}

export function getAdminAuth(): admin.auth.Auth {
  return getApp().auth();
}
