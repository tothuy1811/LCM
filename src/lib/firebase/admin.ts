import "server-only";

import {
  cert,
  getApp,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

function loadServiceAccount() {
  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!base64) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_BASE64 is not set. Copy .env.example to .env.local and fill in Firebase credentials."
    );
  }
  return JSON.parse(Buffer.from(base64, "base64").toString("utf-8"));
}

function initAdminApp(): App {
  if (getApps().length) return getApp();
  return initializeApp({
    credential: cert(loadServiceAccount()),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

const adminApp = initAdminApp();
const firestoreDatabaseId = process.env.NEXT_PUBLIC_FIRESTORE_DATABASE_ID;

export const adminAuth = getAuth(adminApp);
export const adminDb = firestoreDatabaseId
  ? getFirestore(adminApp, firestoreDatabaseId)
  : getFirestore(adminApp);
export const adminStorage = getStorage(adminApp);
