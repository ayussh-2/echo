import type { NotificationItem, CreateReplyPayload, PairingPayload } from "@echo/shared-types";

export interface UserSession {
  uid: string;
  email: string;
  displayName?: string;
  photoUrl?: string;
}

export interface EchoApi {
  getInitialView: () => Promise<{ activeToast?: NotificationItem | null }>;
  closeWindow: () => Promise<void>;
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  openInbox: () => Promise<void>;
  openPairView: () => Promise<void>;
  startGoogleAuth: () => Promise<{ success: boolean; session?: UserSession; error?: string }>;
  getStoredSession: () => Promise<UserSession | null>;
  storeSession: (session: UserSession) => Promise<boolean>;
  clearStoredSession: () => Promise<void>;
  signOut: () => Promise<void>;
  sendReply: (payload: CreateReplyPayload) => Promise<{ success: boolean; error?: string }>;
  dismissToast: (notificationId: string) => Promise<void>;
  sendTestNotification: () => Promise<{ success: boolean }>;
  getNotifications: () => Promise<NotificationItem[]>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearReadNotifications: () => Promise<{ success: boolean; error?: string }>;
  createPairingSession: (desktopName: string) => Promise<PairingPayload>;
  getAutoStart: () => Promise<boolean>;
  setAutoStart: (enabled: boolean) => Promise<void>;
  onNotificationReceived: (callback: (notification: NotificationItem) => void) => () => void;
  onNotificationsUpdated: (callback: (notifications: NotificationItem[]) => void) => () => void;
  onSessionChanged: (callback: (session: UserSession | null) => void) => () => void;
}

declare global {
  interface Window {
    echoApi?: EchoApi;
  }
}
