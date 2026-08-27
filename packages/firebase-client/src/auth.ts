import {
  onAuthStateChanged,
  signOut as fbSignOut,
  signInWithCredential,
  GoogleAuthProvider,
  type User,
  type Unsubscribe,
} from "firebase/auth";
import { getEchoAuth } from "./config";

export function subscribeToAuthState(callback: (user: User | null) => void): Unsubscribe {
  const auth = getEchoAuth();
  return onAuthStateChanged(auth, callback);
}

export function getCurrentUser(): User | null {
  const auth = getEchoAuth();
  return auth.currentUser;
}

export async function signInWithGoogleCredential(idToken: string, accessToken?: string): Promise<User> {
  const auth = getEchoAuth();
  const credential = GoogleAuthProvider.credential(idToken, accessToken);
  const result = await signInWithCredential(auth, credential);
  return result.user;
}

export async function signOut(): Promise<void> {
  const auth = getEchoAuth();
  await fbSignOut(auth);
}
