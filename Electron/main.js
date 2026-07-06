const { app, BrowserWindow } = require("electron");
const path = require("path");
const { pathToFileURL } = require("url");

// ── Resolve correct paths for BOTH dev mode and the packaged app ──────────
// In dev, backend/ and student/ sit one folder up from electron/.
// Once packaged, electron-builder copies them into resources/ instead
// (via "extraResources" in package.json), reachable via
// process.resourcesPath. __dirname-relative paths won't work after
// packaging because the app code runs from inside app.asar.
const backendDir = app.isPackaged
  ? path.join(process.resourcesPath, "backend")
  : path.join(__dirname, "../backend");

const studentDistDir = app.isPackaged
  ? path.join(process.resourcesPath, "student", "dist")
  : path.join(__dirname, "../student/dist");
// ────────────────────────────────────────────────────────────────────────

// Load backend/.env explicitly using an absolute path — process.cwd()
// isn't reliable once packaged. dotenv does NOT overwrite variables that
// are already set, so this takes priority and server.js's own
// "dotenv/config" import becomes a harmless no-op fallback.
require("dotenv").config({
  path: path.join(backendDir, ".env"),
});

async function startBackend() {
  try {
    // server.js is an ES Module and calls app.listen(5000) itself as soon
    // as it's imported — no separate process needed. Electron's main
    // process already runs on Node.js, so we can just import it directly.
    // NO child_process.spawn — that's what was breaking before.
    const backendEntry = pathToFileURL(
      path.join(backendDir, "server.js")
    ).href;

    await import(backendEntry);
    console.log("✅ Backend started in-process on port 5000");
  } catch (err) {
    console.error("❌ Failed to start backend:", err);
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.webContents.on("will-navigate", (event, url) => {
    console.log("🔵 will-navigate:", url);
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    console.log("🟠 window-open:", url);
    return { action: "deny" };
  });

  win.webContents.on(
    "did-fail-load",
    (event, errorCode, errorDescription, validatedURL) => {
      console.log("🔴 Load Failed");
      console.log("URL:", validatedURL);
      console.log("Error:", errorDescription);
      console.log("Code:", errorCode);
    }
  );

  // DevTools only in development — you don't want this popping open
  // for end users who install the finished .exe.
  if (!app.isPackaged) {
    win.webContents.openDevTools();
  }

  win.loadFile(path.join(studentDistDir, "index.html"));
}

app.whenReady().then(async () => {
  await startBackend();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// No child process to kill anymore — the backend runs in this same
// process and shuts down automatically when the app quits.
