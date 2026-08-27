import {
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDoc,
  type Unsubscribe,
} from "firebase/firestore";
import type { PairingPayload, PairingConfirmation } from "@echo/shared-types";
import { getEchoFirestore } from "./config";

export async function createPairingSession(payload: PairingPayload): Promise<void> {
  const db = getEchoFirestore();
  const pairDocRef = doc(db, `users/${payload.uid}/pairing/active`);
  await setDoc(pairDocRef, payload);
}

export function subscribeToPairingSession(
  uid: string,
  onUpdate: (payload: (PairingPayload & { confirmation?: PairingConfirmation }) | null) => void
): Unsubscribe {
  const db = getEchoFirestore();
  const pairDocRef = doc(db, `users/${uid}/pairing/active`);

  return onSnapshot(pairDocRef, (snap) => {
    if (snap.exists()) {
      onUpdate(snap.data() as PairingPayload & { confirmation?: PairingConfirmation });
    } else {
      onUpdate(null);
    }
  });
}

export async function confirmPairing(
  uid: string,
  confirmation: PairingConfirmation
): Promise<boolean> {
  const db = getEchoFirestore();
  const pairDocRef = doc(db, `users/${uid}/pairing/active`);
  const snap = await getDoc(pairDocRef);

  if (!snap.exists()) {
    return false;
  }

  const session = snap.data() as PairingPayload;
  if (session.code !== confirmation.code || Date.now() > session.expiresAt) {
    return false;
  }

  // Write confirmation so the desktop app can observe the success
  await setDoc(pairDocRef, { ...session, confirmation }, { merge: true });
  return true;
}

export async function cleanupPairingSession(uid: string): Promise<void> {
  const db = getEchoFirestore();
  const pairDocRef = doc(db, `users/${uid}/pairing/active`);
  await deleteDoc(pairDocRef);
}
