// Preload script for Echo desktop (CommonJS context for Electron)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { contextBridge, ipcRenderer } = require("electron");

const echoApi = {
  // App state & navigation
  getInitialView: () => ipcRenderer.invoke("get-initial-view"),
  closeWindow: () => ipcRenderer.invoke("close-window"),
  minimizeWindow: () => ipcRenderer.invoke("minimize-window"),
  maximizeWindow: () => ipcRenderer.invoke("maximize-window"),
  openInbox: () => ipcRenderer.invoke("open-inbox"),
  openPairView: () => ipcRenderer.invoke("open-pair-view"),

  // Safe storage credentials & OAuth
  startGoogleAuth: () => ipcRenderer.invoke("start-google-auth"),
  getStoredSession: () => ipcRenderer.invoke("get-stored-session"),
  storeSession: (session: unknown) => ipcRenderer.invoke("store-session", session),
  clearStoredSession: () => ipcRenderer.invoke("clear-stored-session"),
  signOut: () => ipcRenderer.invoke("sign-out"),

  // Toast / Reply
  sendReply: (payload: unknown) => ipcRenderer.invoke("send-reply", payload),
  dismissToast: (notificationId: string) => ipcRenderer.invoke("dismiss-toast", notificationId),
  sendTestNotification: () => ipcRenderer.invoke("send-test-notification"),

  // Notifications
  getNotifications: () => ipcRenderer.invoke("get-notifications"),
  markAsRead: (notificationId: string) => ipcRenderer.invoke("mark-notification-read", notificationId),
  markAllAsRead: () => ipcRenderer.invoke("mark-all-read"),
  clearReadNotifications: () => ipcRenderer.invoke("clear-read-notifications"),

  // Pairing
  createPairingSession: (desktopName: string) => ipcRenderer.invoke("create-pairing-session", desktopName),

  // Autostart setting
  getAutoStart: () => ipcRenderer.invoke("get-autostart"),
  setAutoStart: (enabled: boolean) => ipcRenderer.invoke("set-autostart", enabled),

  // Subscriptions from main process
  onNotificationReceived: (callback: (notification: unknown) => void) => {
    const handler = (_: unknown, notif: unknown) => callback(notif);
    ipcRenderer.on("notification-received", handler);
    return () => ipcRenderer.removeListener("notification-received", handler);
  },

  onNotificationsUpdated: (callback: (notifications: unknown) => void) => {
    const handler = (_: unknown, notifs: unknown) => callback(notifs);
    ipcRenderer.on("notifications-updated", handler);
    return () => ipcRenderer.removeListener("notifications-updated", handler);
  },

  onSessionChanged: (callback: (session: unknown) => void) => {
    const handler = (_: unknown, s: unknown) => callback(s);
    ipcRenderer.on("session-changed", handler);
    return () => ipcRenderer.removeListener("session-changed", handler);
  },
};

contextBridge.exposeInMainWorld("echoApi", echoApi);
