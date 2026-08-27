import { contextBridge, ipcRenderer } from "electron";
import type { NotificationItem, CreateReplyPayload, PairingPayload } from "@echo/shared-types";

// Narrow, explicit IPC bridge keeping the renderer strictly isolated
const echoApi = {
  // App state & navigation
  getInitialView: (): Promise<{ view: "toast" | "inbox" | "pair"; data?: unknown }> =>
    ipcRenderer.invoke("get-initial-view"),
  
  closeWindow: (): Promise<void> =>
    ipcRenderer.invoke("close-window"),

  minimizeWindow: (): Promise<void> =>
    ipcRenderer.invoke("minimize-window"),

  maximizeWindow: (): Promise<void> =>
    ipcRenderer.invoke("maximize-window"),

  // Safe storage credentials
  getStoredSession: (): Promise<{ uid: string; email: string } | null> =>
    ipcRenderer.invoke("get-stored-session"),

  storeSession: (session: { uid: string; email: string }): Promise<boolean> =>
    ipcRenderer.invoke("store-session", session),

  clearStoredSession: (): Promise<void> =>
    ipcRenderer.invoke("clear-stored-session"),

  // Toast / Reply
  sendReply: (payload: CreateReplyPayload): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke("send-reply", payload),

  dismissToast: (notificationId: string): Promise<void> =>
    ipcRenderer.invoke("dismiss-toast", notificationId),

  // Pairing
  createPairingSession: (desktopName: string): Promise<PairingPayload> =>
    ipcRenderer.invoke("create-pairing-session", desktopName),

  // Autostart setting
  getAutoStart: (): Promise<boolean> =>
    ipcRenderer.invoke("get-autostart"),

  setAutoStart: (enabled: boolean): Promise<void> =>
    ipcRenderer.invoke("set-autostart", enabled),

  // Subscriptions from main process
  onNotificationReceived: (callback: (notification: NotificationItem) => void) => {
    const handler = (_: unknown, notif: NotificationItem) => callback(notif);
    ipcRenderer.on("notification-received", handler);
    return () => ipcRenderer.removeListener("notification-received", handler);
  },
};

export type EchoApi = typeof echoApi;

contextBridge.exposeInMainWorld("echoApi", echoApi);
