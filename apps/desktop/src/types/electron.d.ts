import type { NotificationItem, CreateReplyPayload, PairingPayload } from "@echo/shared-types";

export interface EchoApi {
  getInitialView: () => Promise<{ activeToast?: NotificationItem | null }>;
  closeWindow: () => Promise<void>;
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  getStoredSession: () => Promise<{ uid: string; email: string } | null>;
  storeSession: (session: { uid: string; email: string }) => Promise<boolean>;
  clearStoredSession: () => Promise<void>;
  sendReply: (payload: CreateReplyPayload) => Promise<{ success: boolean; error?: string }>;
  dismissToast: (notificationId: string) => Promise<void>;
  createPairingSession: (desktopName: string) => Promise<PairingPayload>;
  getAutoStart: () => Promise<boolean>;
  setAutoStart: (enabled: boolean) => Promise<void>;
  onNotificationReceived: (callback: (notification: NotificationItem) => void) => () => void;
}

declare global {
  interface Window {
    echoApi?: EchoApi;
  }
}
