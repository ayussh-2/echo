import { contextBridge, ipcRenderer } from "electron";
const echoApi = {
  // App state & navigation
  getInitialView: () => ipcRenderer.invoke("get-initial-view"),
  closeWindow: () => ipcRenderer.invoke("close-window"),
  minimizeWindow: () => ipcRenderer.invoke("minimize-window"),
  maximizeWindow: () => ipcRenderer.invoke("maximize-window"),
  // Safe storage credentials
  getStoredSession: () => ipcRenderer.invoke("get-stored-session"),
  storeSession: (session) => ipcRenderer.invoke("store-session", session),
  clearStoredSession: () => ipcRenderer.invoke("clear-stored-session"),
  // Toast / Reply
  sendReply: (payload) => ipcRenderer.invoke("send-reply", payload),
  dismissToast: (notificationId) => ipcRenderer.invoke("dismiss-toast", notificationId),
  // Pairing
  createPairingSession: (desktopName) => ipcRenderer.invoke("create-pairing-session", desktopName),
  // Autostart setting
  getAutoStart: () => ipcRenderer.invoke("get-autostart"),
  setAutoStart: (enabled) => ipcRenderer.invoke("set-autostart", enabled),
  // Subscriptions from main process
  onNotificationReceived: (callback) => {
    const handler = (_, notif) => callback(notif);
    ipcRenderer.on("notification-received", handler);
    return () => ipcRenderer.removeListener("notification-received", handler);
  }
};
contextBridge.exposeInMainWorld("echoApi", echoApi);
