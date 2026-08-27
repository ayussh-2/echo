import { app, BrowserWindow, Tray, Menu, ipcMain, screen, safeStorage, nativeImage, powerMonitor } from "electron";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { createPairingPayload } from "@echo/crypto";
import type { NotificationItem, CreateReplyPayload, PairingPayload } from "@echo/shared-types";
import {
  initializeEchoFirebase,
  getEchoAuth,
  signInWithGoogleCredential,
  signOut as fbSignOut,
  subscribeToNotifications,
  createReply,
  writeNotification,
  markNotificationRead,
  deleteReadNotifications,
  createPairingSession,
  subscribeToPairingSession,
} from "@echo/firebase-client";
import { performGoogleOAuthFlow } from "./oauth";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to reliably load .env and .env.local in Electron Main process
function loadEnvironmentVariables(): void {
  const candidatePaths = [
    path.join(process.cwd(), ".env.local"),
    path.join(process.cwd(), ".env"),
    path.join(process.cwd(), "../.env.local"),
    path.join(process.cwd(), "../.env"),
    path.join(process.cwd(), "../../.env.local"),
    path.join(process.cwd(), "../../.env"),
    path.join(__dirname, "../.env.local"),
    path.join(__dirname, "../.env"),
    path.join(__dirname, "../../.env.local"),
    path.join(__dirname, "../../.env"),
    path.join(__dirname, "../../../.env.local"),
    path.join(__dirname, "../../../.env"),
  ];

  for (const envPath of candidatePaths) {
    try {
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf-8");
        for (const line of content.split(/\r?\n/)) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
            const idx = trimmed.indexOf("=");
            const key = trimmed.slice(0, idx).trim();
            const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
            process.env[key] = val;
          }
        }
      }
    } catch {
      // Ignore reading error
    }
  }
}

loadEnvironmentVariables();

export interface StoredSession {
  uid: string;
  email: string;
  displayName?: string;
  photoUrl?: string;
  idToken?: string;
  refreshToken?: string;
}

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

let tray: Tray | null = null;
let mainWindow: BrowserWindow | null = null;
let toastWindow: BrowserWindow | null = null;
let activeToastNotification: NotificationItem | null = null;
let currentNotifications: NotificationItem[] = [];
let isPaused = false;
let notificationUnsubscribe: (() => void) | null = null;
let pairingUnsubscribe: (() => void) | null = null;

const SESSION_FILE_PATH = path.join(app.getPath("userData"), "session.dat");

// Initialize Firebase SDK
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "echo-notif.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "echo-notif",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "echo-notif.appspot.com",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "0000000000",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:0000000000:web:0000000000",
};

try {
  initializeEchoFirebase(firebaseConfig);
} catch {
  // Config loader
}

function getStoredSessionSync(): StoredSession | null {
  try {
    if (!fs.existsSync(SESSION_FILE_PATH)) return null;
    const buffer = fs.readFileSync(SESSION_FILE_PATH);
    if (safeStorage.isEncryptionAvailable()) {
      const decrypted = safeStorage.decryptString(buffer);
      return JSON.parse(decrypted);
    }
    return JSON.parse(buffer.toString("utf-8"));
  } catch {
    return null;
  }
}

function storeSessionSync(session: StoredSession): boolean {
  try {
    const raw = JSON.stringify(session);
    if (safeStorage.isEncryptionAvailable()) {
      const encrypted = safeStorage.encryptString(raw);
      fs.writeFileSync(SESSION_FILE_PATH, encrypted);
    } else {
      fs.writeFileSync(SESSION_FILE_PATH, Buffer.from(raw, "utf-8"));
    }
    return true;
  } catch {
    return false;
  }
}

function clearSessionSync(): void {
  try {
    if (fs.existsSync(SESSION_FILE_PATH)) {
      fs.unlinkSync(SESSION_FILE_PATH);
    }
  } catch {
    // Ignore
  }
}

async function restoreFirebaseAuth(session: StoredSession): Promise<boolean> {
  if (!session.idToken) return false;
  try {
    const auth = getEchoAuth();
    if (!auth.currentUser || auth.currentUser.uid !== session.uid) {
      await signInWithGoogleCredential(session.idToken);
    }
    return true;
  } catch (err) {
    console.warn("Could not restore Firebase session with cached token:", err);
    return false;
  }
}

function updateTrayMenu(): void {
  if (!tray) return;

  const session = getStoredSessionSync();
  const emailText = session?.email ? `Signed in as ${session.email}` : "Not signed in";
  const unreadCount = currentNotifications.filter((n) => !n.isRead).length;

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open Echo",
      click: () => openInboxWindow(),
    },
    {
      label: `Missed Notifications (${unreadCount})`,
      enabled: unreadCount > 0,
      click: () => openInboxWindow(),
    },
    {
      label: "Pair Phone...",
      click: () => openPairWindow(),
    },
    { type: "separator" },
    {
      label: isPaused ? "Resume Forwarding" : "Pause Forwarding",
      click: () => {
        isPaused = !isPaused;
        updateTrayMenu();
      },
    },
    {
      label: emailText,
      enabled: false,
    },
    { type: "separator" },
    {
      label: "Sign Out",
      enabled: Boolean(session),
      click: async () => {
        await handleSignOut();
      },
    },
    {
      label: "Quit Echo",
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip(`Echo — ${unreadCount > 0 ? `${unreadCount} unread` : "Listening"}`);
}

function createTray(): void {
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  updateTrayMenu();

  tray.on("double-click", () => {
    openInboxWindow();
  });
}

function getPreloadPath(): string {
  const candidates = [
    path.join(__dirname, "preload.cjs"),
    path.join(__dirname, "preload.mjs"),
    path.join(__dirname, "preload.js"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return path.join(__dirname, "preload.js");
}

function openInboxWindow(): void {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
    if (process.env.VITE_DEV_SERVER_URL) {
      mainWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}#inbox`);
    } else {
      mainWindow.loadFile(path.join(__dirname, "../dist/index.html"), { hash: "inbox" });
    }
    return;
  }

  mainWindow = new BrowserWindow({
    width: 480,
    height: 640,
    show: false,
    frame: false,
    transparent: true,
    backgroundMaterial: "acrylic",
    minimizable: true,
    maximizable: false,
    resizable: false,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}#inbox`);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"), { hash: "inbox" });
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function openPairWindow(): void {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
    if (process.env.VITE_DEV_SERVER_URL) {
      mainWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}#pair`);
    } else {
      mainWindow.loadFile(path.join(__dirname, "../dist/index.html"), { hash: "pair" });
    }
    return;
  }

  mainWindow = new BrowserWindow({
    width: 480,
    height: 640,
    show: false,
    frame: false,
    transparent: true,
    backgroundMaterial: "acrylic",
    minimizable: true,
    maximizable: false,
    resizable: false,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}#pair`);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"), { hash: "pair" });
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

export function showReplyToast(notification: NotificationItem): void {
  if (isPaused) return;

  activeToastNotification = notification;

  if (toastWindow) {
    toastWindow.destroy();
    toastWindow = null;
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  const toastWidth = 400;
  const toastHeight = 175;

  toastWindow = new BrowserWindow({
    width: toastWidth,
    height: toastHeight,
    x: width - toastWidth - 24,
    y: height - toastHeight - 24,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    hasShadow: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    focusable: true,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    toastWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}#toast`);
  } else {
    toastWindow.loadFile(path.join(__dirname, "../dist/index.html"), { hash: "toast" });
  }

  toastWindow.on("closed", () => {
    toastWindow = null;
  });
}

function startNotificationListener(uid: string): void {
  if (notificationUnsubscribe) {
    notificationUnsubscribe();
    notificationUnsubscribe = null;
  }

  try {
    notificationUnsubscribe = subscribeToNotifications(
      uid,
      (notifications) => {
        currentNotifications = notifications;
        if (notifications.length > 0) {
          const newest = notifications[0];
          if (newest && !newest.isRead && (!activeToastNotification || activeToastNotification.id !== newest.id)) {
            showReplyToast(newest);
          }
        }
        updateTrayMenu();
        if (mainWindow) {
          mainWindow.webContents.send("notifications-updated", notifications);
        }
      },
      () => {
        // Quiet fallback
      }
    );
  } catch {
    // Offline fallback
  }
}

async function handleSignOut(): Promise<void> {
  if (notificationUnsubscribe) {
    notificationUnsubscribe();
    notificationUnsubscribe = null;
  }
  if (pairingUnsubscribe) {
    pairingUnsubscribe();
    pairingUnsubscribe = null;
  }
  try {
    await fbSignOut();
  } catch {
    // Ignore
  }
  clearSessionSync();
  updateTrayMenu();
  if (mainWindow) {
    mainWindow.webContents.send("session-changed", null);
  }
}

function registerIpcHandlers(): void {
  ipcMain.handle("get-initial-view", () => {
    return {
      activeToast: activeToastNotification,
    };
  });

  ipcMain.handle("close-window", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender) || BrowserWindow.getFocusedWindow() || mainWindow;
    if (win) {
      win.close();
    }
  });

  ipcMain.handle("minimize-window", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender) || BrowserWindow.getFocusedWindow() || mainWindow;
    if (win) {
      win.minimize();
    }
  });

  ipcMain.handle("maximize-window", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender) || BrowserWindow.getFocusedWindow() || mainWindow;
    if (win) {
      if (win.isMaximized()) {
        win.unmaximize();
      } else {
        win.maximize();
      }
    }
  });

  ipcMain.handle("open-inbox", () => {
    openInboxWindow();
  });

  ipcMain.handle("open-pair-view", () => {
    openPairWindow();
  });

  // Google OAuth flow
  ipcMain.handle("start-google-auth", async () => {
    try {
      const clientId = process.env.VITE_GOOGLE_CLIENT_ID || "";
      const clientSecret = process.env.VITE_GOOGLE_CLIENT_SECRET;

      if (!clientId) {
        throw new Error("Missing VITE_GOOGLE_CLIENT_ID in your .env file.");
      }

      const authResult = await performGoogleOAuthFlow(clientId, clientSecret);
      const user = await signInWithGoogleCredential(authResult.idToken, authResult.accessToken);

      const session: StoredSession = {
        uid: user.uid,
        email: user.email || authResult.email || "",
        displayName: user.displayName || authResult.name,
        photoUrl: user.photoURL || authResult.picture,
        idToken: authResult.idToken,
        refreshToken: authResult.refreshToken,
      };

      storeSessionSync(session);
      startNotificationListener(session.uid);
      updateTrayMenu();

      if (mainWindow) {
        mainWindow.webContents.send("session-changed", session);
      }

      return {
        success: true,
        session: {
          uid: session.uid,
          email: session.email,
          displayName: session.displayName,
          photoUrl: session.photoUrl,
        },
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Authentication failed",
      };
    }
  });

  ipcMain.handle("get-stored-session", () => {
    const session = getStoredSessionSync();
    if (!session) return null;
    return {
      uid: session.uid,
      email: session.email,
      displayName: session.displayName,
      photoUrl: session.photoUrl,
    };
  });

  ipcMain.handle("store-session", (_, session: StoredSession) => {
    const success = storeSessionSync(session);
    if (success && session.uid) {
      startNotificationListener(session.uid);
    }
    updateTrayMenu();
    return success;
  });

  ipcMain.handle("clear-stored-session", async () => {
    await handleSignOut();
  });

  ipcMain.handle("sign-out", async () => {
    await handleSignOut();
  });

  ipcMain.handle("dismiss-toast", () => {
    if (toastWindow) {
      toastWindow.close();
      toastWindow = null;
    }
    activeToastNotification = null;
  });

  ipcMain.handle("send-test-notification", async () => {
    const session = getStoredSessionSync();
    if (session) {
      await restoreFirebaseAuth(session);
    }

    const testItem: NotificationItem = {
      id: `notif-${Date.now()}`,
      packageName: "com.whatsapp",
      appName: "WhatsApp",
      conversationId: "conv-riya",
      title: "Riya Sharma",
      text: "Hey! Echo notifications are syncing to Windows 🎉",
      postedAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      hasReplyAction: true,
      isRead: false,
      isGroup: false,
      key: `key-${Date.now()}`,
    };

    if (session?.uid) {
      try {
        await writeNotification(session.uid, testItem);
      } catch {
        showReplyToast(testItem);
      }
    } else {
      showReplyToast(testItem);
    }

    return { success: true };
  });

  ipcMain.handle("send-reply", async (_, payload: CreateReplyPayload) => {
    const session = getStoredSessionSync();
    if (!session?.uid) {
      return { success: false, error: "Not authenticated" };
    }
    await restoreFirebaseAuth(session);
    try {
      const replyId = await createReply(session.uid, payload);
      // Automatically mark replied notification as seen/read in Firestore
      if (payload.notificationId) {
        await markNotificationRead(session.uid, payload.notificationId).catch(() => {});
      }
      if (toastWindow) {
        toastWindow.close();
        toastWindow = null;
      }
      activeToastNotification = null;
      return { success: true, replyId };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Failed to send reply" };
    }
  });

  ipcMain.handle("get-notifications", () => {
    return currentNotifications;
  });

  ipcMain.handle("mark-notification-read", async (_, notificationId: string) => {
    const session = getStoredSessionSync();
    if (!session?.uid) return;
    try {
      await markNotificationRead(session.uid, notificationId);
    } catch {
      // Offline fallback
    }
  });

  ipcMain.handle("mark-all-read", async () => {
    const session = getStoredSessionSync();
    if (!session?.uid) return;
    for (const notif of currentNotifications) {
      if (!notif.isRead) {
        markNotificationRead(session.uid, notif.id).catch(() => {});
      }
    }
  });

  ipcMain.handle("clear-read-notifications", async () => {
    const session = getStoredSessionSync();
    if (!session?.uid) return { success: false };
    await restoreFirebaseAuth(session);
    try {
      await deleteReadNotifications(session.uid);
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Failed to clear seen" };
    }
  });

  ipcMain.handle("create-pairing-session", async (_, desktopName: string): Promise<PairingPayload> => {
    const session = getStoredSessionSync();
    const uid = session?.uid ?? "unknown-user";
    const payload = createPairingPayload(uid, desktopName);

    try {
      await createPairingSession(payload);

      // Listen for mobile confirmation
      if (pairingUnsubscribe) pairingUnsubscribe();
      pairingUnsubscribe = subscribeToPairingSession(uid, (data) => {
        if (data?.confirmation) {
          // Pairing verified!
          if (mainWindow) {
            openInboxWindow();
          }
        }
      });
    } catch {
      // Offline fallback
    }

    return payload;
  });

  ipcMain.handle("get-autostart", () => {
    return app.getLoginItemSettings().openAtLogin;
  });

  ipcMain.handle("set-autostart", (_, enabled: boolean) => {
    app.setLoginItemSettings({
      openAtLogin: enabled,
      path: app.getPath("exe"),
    });
  });
}

// PowerMonitor sleep / wake event handling
powerMonitor.on("resume", () => {
  const session = getStoredSessionSync();
  if (session?.uid) {
    startNotificationListener(session.uid);
  }
});

powerMonitor.on("suspend", () => {
  if (notificationUnsubscribe) {
    notificationUnsubscribe();
    notificationUnsubscribe = null;
  }
});

app.whenReady().then(async () => {
  createTray();
  registerIpcHandlers();

  // Check if session exists on startup; restore auth and start listener
  const session = getStoredSessionSync();
  if (session?.uid) {
    if (session.idToken) {
      await restoreFirebaseAuth(session);
    }
    startNotificationListener(session.uid);
  } else {
    openPairWindow();
  }
});

app.on("window-all-closed", () => {
  // Stay resident in tray when windows are closed
});
