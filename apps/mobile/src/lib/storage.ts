import * as SecureStore from "expo-secure-store";

export interface MobilePairedSession {
  uid: string;
  desktopId: string;
  desktopName: string;
  pairedAt: number;
}

const KEYS = {
  SESSION: "echo_paired_session",
  WHITELIST: "echo_whitelisted_apps",
  FORWARDING_ENABLED: "echo_forwarding_enabled",
};

export const DEFAULT_WHITELIST = [
  "com.whatsapp",
  "com.google.android.apps.messaging",
  "com.android.mms",
  "org.telegram.messenger",
  "org.thoughtcrime.securesms",
  "com.instagram.android",
  "com.slack",
  "com.discord",
];

export async function getStoredSession(): Promise<MobilePairedSession | null> {
  try {
    const raw = await SecureStore.getItemAsync(KEYS.SESSION);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function setStoredSession(session: MobilePairedSession): Promise<void> {
  await SecureStore.setItemAsync(KEYS.SESSION, JSON.stringify(session));
}

export async function clearStoredSession(): Promise<void> {
  await SecureStore.deleteItemAsync(KEYS.SESSION);
}

export async function getWhitelistedApps(): Promise<string[]> {
  try {
    const raw = await SecureStore.getItemAsync(KEYS.WHITELIST);
    if (!raw) return DEFAULT_WHITELIST;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_WHITELIST;
  }
}

export async function setWhitelistedApps(apps: string[]): Promise<void> {
  await SecureStore.setItemAsync(KEYS.WHITELIST, JSON.stringify(apps));
}

export async function getIsForwardingEnabled(): Promise<boolean> {
  try {
    const raw = await SecureStore.getItemAsync(KEYS.FORWARDING_ENABLED);
    if (raw === null) return true;
    return raw === "true";
  } catch {
    return true;
  }
}

export async function setIsForwardingEnabled(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(KEYS.FORWARDING_ENABLED, enabled ? "true" : "false");
}
