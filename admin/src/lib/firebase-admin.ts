import * as admin from "firebase-admin";

function getApp(): admin.app.App {
  if (admin.apps.length === 0) {
    admin.initializeApp();
  }
  return admin.apps[0]!;
}

export function getAdminDb(): FirebaseFirestore.Firestore {
  return getApp().firestore();
}

export function getAdminAuth(): admin.auth.Auth {
  return getApp().auth();
}
