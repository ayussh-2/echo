import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;

export function initializeEchoFirebase(config: FirebaseOptions): {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
} {
  app = getApps().length > 0 ? getApp() : initializeApp(config);
  auth = getAuth(app);
  firestore = getFirestore(app);
  return { app, auth, firestore };
}

export function getEchoAuth(): Auth {
  if (!auth) {
    throw new Error("Firebase Auth has not been initialized. Call initializeEchoFirebase() first.");
  }
  return auth;
}

export function getEchoFirestore(): Firestore {
  if (!firestore) {
    throw new Error("Firestore has not been initialized. Call initializeEchoFirebase() first.");
  }
  return firestore;
}
