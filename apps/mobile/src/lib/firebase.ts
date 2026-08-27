import { initializeEchoFirebase, defaultFirebaseConfig, signInAnonymouslyUser } from "@echo/firebase-client";

export const mobileFirebaseConfig = {
  apiKey:
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY ||
    defaultFirebaseConfig.apiKey ||
    "demo-api-key",
  authDomain:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    defaultFirebaseConfig.authDomain ||
    "echo-notif.firebaseapp.com",
  projectId:
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ||
    defaultFirebaseConfig.projectId ||
    "echo-notif",
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    defaultFirebaseConfig.storageBucket ||
    "echo-notif.appspot.com",
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    defaultFirebaseConfig.messagingSenderId ||
    "0000000000",
  appId:
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID ||
    defaultFirebaseConfig.appId ||
    "1:0000000000:web:0000000000",
};

let isInitialized = false;

export function initMobileFirebase() {
  if (isInitialized) return;
  try {
    initializeEchoFirebase(mobileFirebaseConfig);
    isInitialized = true;
    signInAnonymouslyUser().catch(() => {
      // Offline or anonymous auth disabled in console - rules fallback handles open pairing
    });
  } catch (err) {
    console.warn("[Echo Mobile] Firebase initialization error:", err);
  }
}

// Auto-run on module load
initMobileFirebase();
