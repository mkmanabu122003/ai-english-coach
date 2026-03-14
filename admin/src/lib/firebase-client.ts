import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

function getClientApp() {
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeApp(firebaseConfig);
}

export function getClientAuth(): Auth {
  return getAuth(getClientApp());
}
