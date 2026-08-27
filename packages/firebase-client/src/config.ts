import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { getAuth, initializeAuth, inMemoryPersistence, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;

declare const process: { env?: Record<string, string | undefined> } | undefined;

export const defaultFirebaseConfig: FirebaseOptions = {
  apiKey:
    (typeof process !== "undefined" && (process?.env?.EXPO_PUBLIC_FIREBASE_API_KEY || process?.env?.VITE_FIREBASE_API_KEY)) ||
    "demo-api-key",
  authDomain:
    (typeof process !== "undefined" && (process?.env?.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || process?.env?.VITE_FIREBASE_AUTH_DOMAIN)) ||
    "echo-notif.firebaseapp.com",
  projectId:
    (typeof process !== "undefined" && (process?.env?.EXPO_PUBLIC_FIREBASE_PROJECT_ID || process?.env?.VITE_FIREBASE_PROJECT_ID)) ||
    "echo-notif",
  storageBucket:
    (typeof process !== "undefined" && (process?.env?.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || process?.env?.VITE_FIREBASE_STORAGE_BUCKET)) ||
    "echo-notif.appspot.com",
  messagingSenderId:
    (typeof process !== "undefined" && (process?.env?.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process?.env?.VITE_FIREBASE_MESSAGING_SENDER_ID)) ||
    "0000000000",
  appId:
    (typeof process !== "undefined" && (process?.env?.EXPO_PUBLIC_FIREBASE_APP_ID || process?.env?.VITE_FIREBASE_APP_ID)) ||
    "1:0000000000:web:0000000000",
};

export function initializeEchoFirebase(config: FirebaseOptions = defaultFirebaseConfig): {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
} {
  app = getApps().length > 0 ? getApp() : initializeApp(config);
  try {
    auth = initializeAuth(app, {
      persistence: inMemoryPersistence,
    });
  } catch {
    auth = getAuth(app);
  }
  firestore = getFirestore(app);
  return { app, auth, firestore };
}

export function getEchoAuth(): Auth {
  if (!auth) {
    initializeEchoFirebase(defaultFirebaseConfig);
  }
  return auth!;
}

export function getEchoFirestore(): Firestore {
  if (!firestore) {
    initializeEchoFirebase(defaultFirebaseConfig);
  }
  return firestore!;
}
