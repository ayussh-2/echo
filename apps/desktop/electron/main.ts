import { app, BrowserWindow, Tray, Menu, ipcMain, screen, safeStorage, nativeImage } from "electron";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { createPairingPayload } from "@echo/crypto";
import type { NotificationItem, PairingPayload } from "@echo/shared-types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

let tray: Tray | null = null;
let mainWindow: BrowserWindow | null = null;
let toastWindow: BrowserWindow | null = null;
let activeToastNotification: NotificationItem | null = null;
let unseenCount = 0;
let isPaused = false;

const SESSION_FILE_PATH = path.join(app.getPath("userData"), "session.dat");

function getStoredSessionSync(): { uid: string; email: string } | null {
  try {
    if (!fs.existsSync(SESSION_FILE_PATH)) return null;
    const encrypted = fs.readFileSync(SESSION_FILE_PATH);
    if (!safeStorage.isEncryptionAvailable()) {
      return JSON.parse(encrypted.toString("utf-8"));
    }
    const decrypted = safeStorage.decryptString(encrypted);
    return JSON.parse(decrypted);
  } catch {
    return null;
  }
}

function storeSessionSync(session: { uid: string; email: string }): boolean {
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
    // Ignore cleanup failure
  }
}

function updateTrayMenu(): void {
  if (!tray) return;

  const session = getStoredSessionSync();
  const emailText = session?.email ? `Signed in as ${session.email}` : "Not signed in";

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open Echo",
      click: () => openInboxWindow(),
    },
    {
      label: `Missed (${unseenCount})`,
      enabled: unseenCount > 0,
      click: () => openInboxWindow(),
    },
    { type: "separator" },
    {
      label: isPaused ? "Resume forwarding" : "Pause forwarding",
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
      label: "Quit",
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip(`Echo — ${unseenCount > 0 ? `${unseenCount} missed notifications` : "Listening"}`);
}

function createTray(): void {
  // Create 16x16 tray icon programmatically or from asset
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  updateTrayMenu();

  tray.on("double-click", () => {
    openInboxWindow();
  });
}

function openInboxWindow(): void {
  if (mainWindow) {
    mainWindow.focus();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 480,
    height: 640,
    show: false,
    frame: false,
    transparent: true,
    minimizable: true,
    maximizable: false,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
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
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    focusable: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
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

  ipcMain.handle("get-stored-session", () => {
    return getStoredSessionSync();
  });

  ipcMain.handle("store-session", (_, session: { uid: string; email: string }) => {
    const success = storeSessionSync(session);
    updateTrayMenu();
    return success;
  });

  ipcMain.handle("clear-stored-session", () => {
    clearSessionSync();
    updateTrayMenu();
  });

  ipcMain.handle("dismiss-toast", () => {
    if (toastWindow) {
      toastWindow.close();
      toastWindow = null;
    }
    activeToastNotification = null;
  });

  ipcMain.handle("create-pairing-session", (_, desktopName: string): PairingPayload => {
    const session = getStoredSessionSync();
    const uid = session?.uid ?? "unknown-user";
    return createPairingPayload(uid, desktopName);
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

app.whenReady().then(() => {
  createTray();
  registerIpcHandlers();

  // Check if session exists on startup; if not, open pair setup
  const session = getStoredSessionSync();
  if (!session) {
    openInboxWindow();
  }
});

app.on("window-all-closed", () => {
  // Stay resident in tray when windows are closed
});
