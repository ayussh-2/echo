import { app, nativeImage, Tray, ipcMain, BrowserWindow, safeStorage, Menu, screen } from "electron";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
function generatePairingCode() {
  const segment1 = Array.from(
    { length: 3 },
    () => CODE_ALPHABET.charAt(Math.floor(Math.random() * CODE_ALPHABET.length))
  ).join("");
  const segment2 = Array.from(
    { length: 3 },
    () => CODE_ALPHABET.charAt(Math.floor(Math.random() * CODE_ALPHABET.length))
  ).join("");
  return `${segment1}-${segment2}`;
}
function createPairingPayload(uid, desktopDeviceName, ttlMs = 2 * 60 * 1e3) {
  const now = Date.now();
  return {
    uid,
    code: generatePairingCode(),
    desktopDeviceName,
    createdAt: now,
    expiresAt: now + ttlMs
  };
}
const __filename$1 = fileURLToPath(import.meta.url);
const __dirname$1 = path.dirname(__filename$1);
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}
let tray = null;
let mainWindow = null;
let toastWindow = null;
let activeToastNotification = null;
let unseenCount = 0;
let isPaused = false;
const SESSION_FILE_PATH = path.join(app.getPath("userData"), "session.dat");
function getStoredSessionSync() {
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
function storeSessionSync(session) {
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
function clearSessionSync() {
  try {
    if (fs.existsSync(SESSION_FILE_PATH)) {
      fs.unlinkSync(SESSION_FILE_PATH);
    }
  } catch {
  }
}
function updateTrayMenu() {
  if (!tray) return;
  const session = getStoredSessionSync();
  const emailText = (session == null ? void 0 : session.email) ? `Signed in as ${session.email}` : "Not signed in";
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open Echo",
      click: () => openInboxWindow()
    },
    {
      label: `Missed (${unseenCount})`,
      enabled: unseenCount > 0,
      click: () => openInboxWindow()
    },
    { type: "separator" },
    {
      label: isPaused ? "Resume forwarding" : "Pause forwarding",
      click: () => {
        isPaused = !isPaused;
        updateTrayMenu();
      }
    },
    {
      label: emailText,
      enabled: false
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        app.quit();
      }
    }
  ]);
  tray.setContextMenu(contextMenu);
  tray.setToolTip(`Echo — ${"Listening"}`);
}
function createTray() {
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  updateTrayMenu();
  tray.on("double-click", () => {
    openInboxWindow();
  });
}
function openInboxWindow() {
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
      preload: path.join(__dirname$1, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}#inbox`);
  } else {
    mainWindow.loadFile(path.join(__dirname$1, "../dist/index.html"), { hash: "inbox" });
  }
  mainWindow.once("ready-to-show", () => {
    mainWindow == null ? void 0 : mainWindow.show();
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
function showReplyToast(notification) {
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
      preload: path.join(__dirname$1, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    toastWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}#toast`);
  } else {
    toastWindow.loadFile(path.join(__dirname$1, "../dist/index.html"), { hash: "toast" });
  }
  toastWindow.on("closed", () => {
    toastWindow = null;
  });
}
function registerIpcHandlers() {
  ipcMain.handle("get-initial-view", () => {
    return {
      activeToast: activeToastNotification
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
  ipcMain.handle("store-session", (_, session) => {
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
  ipcMain.handle("create-pairing-session", (_, desktopName) => {
    const session = getStoredSessionSync();
    const uid = (session == null ? void 0 : session.uid) ?? "unknown-user";
    return createPairingPayload(uid, desktopName);
  });
  ipcMain.handle("get-autostart", () => {
    return app.getLoginItemSettings().openAtLogin;
  });
  ipcMain.handle("set-autostart", (_, enabled) => {
    app.setLoginItemSettings({
      openAtLogin: enabled,
      path: app.getPath("exe")
    });
  });
}
app.whenReady().then(() => {
  createTray();
  registerIpcHandlers();
  const session = getStoredSessionSync();
  if (!session) {
    openInboxWindow();
  }
});
app.on("window-all-closed", () => {
});
export {
  showReplyToast
};
