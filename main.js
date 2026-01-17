const { app, BrowserWindow, shell, Menu, ipcMain } = require("electron");
const path = require("path");
app.enableSandbox();

app.commandLine.appendSwitch("use-angle", "metal");

const TRY_DEMO =
"https://u3.shortink.io/cabinet/demo-high-low/?try-demo=1&utm_campaign=760947&utm_source=affiliate&utm_medium=sr&a=SATCVHJAFBATiH&ac=adsupply_trydemo_revenue_model_mass_volume_voluum_year2023_new_test_30_sept_2023_updown_win_trydemo&code=50START";
const REGISTER =
"https://u3.shortink.io/register?utm_campaign=760947&utm_source=affiliate&utm_medium=sr&a=SATCVHJAFBATiH&ac=adsupply_trydemo_revenue_model_mass_volume_voluum_year2023_new_test_30_sept_2023_updown_win_reg&code=50START";


let mainWin = null;
let promptWin = null;

function openRegisterExternal() {
  return shell.openExternal(REGISTER);
}

function showPrompt() {
  if (!mainWin) return;

  if (promptWin && !promptWin.isDestroyed()) {
    promptWin.focus();
    return;
  }

  const { width, height } = mainWin.getBounds();

promptWin = new BrowserWindow({
  parent: mainWin,
  modal: true,
  width: Math.round(width * 0.65),
  height: Math.round(height * 0.65),
  resizable: false,
  minimizable: false,
  maximizable: false,
  show: false,

webPreferences: {
  preload: path.join(__dirname, "preload.js"),
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: true
}

});

  promptWin.loadFile(path.join(__dirname, "prompt.html"));

  promptWin.webContents.on("did-fail-load", (_, code, desc, url) => {
    console.error("PROMPT failed to load:", code, desc, url);
  });

  promptWin.once("ready-to-show", () => promptWin.show());
  promptWin.on("closed", () => { promptWin = null; });
}

ipcMain.on("open-register", async () => {
  await openRegisterExternal();
  if (promptWin) promptWin.close();
});

ipcMain.on("prompt-close", () => {
  if (promptWin) promptWin.close();
});

function createWindow() {
  mainWin = new BrowserWindow({
    width: 1400,
    height: 900,
    title: "Pocket Option Demo Account — Try Free Trading",
    webPreferences: {
      preload: __dirname + "/preload.js",
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  mainWin.webContents.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
  );

  mainWin.loadURL(TRY_DEMO);
  // Intercept all real-account related actions and open externally
  const shouldOpenExternally = (url) => {
    return (
      url.includes("register") ||
      url.includes("real") ||
      url.includes("deposit") ||
      url.includes("cashier") ||
      url.includes("top-up")
    );
  };

  mainWin.webContents.on("will-navigate", (event, url) => {
    if (shouldOpenExternally(url)) {
      event.preventDefault();
      shell.openExternal(REGISTER);
    }
  });

  mainWin.webContents.setWindowOpenHandler(({ url }) => {
    if (shouldOpenExternally(url)) {
      shell.openExternal(REGISTER);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  mainWin.webContents.setWindowOpenHandler(({ url }) => {
    if (url.includes("/register") || url.includes("register")) {
      shell.openExternal(REGISTER);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  // Popup after 5 seconds
  setTimeout(() => {
    console.log("Showing prompt after 5 seconds...");
    showPrompt();
  }, 5000);

  const menu = Menu.buildFromTemplate([
    {
      label: "Account",
      submenu: [
        { label: "Create Real Account (opens browser)", click: () => openRegisterExternal() },
        { label: "Show Register Prompt", click: () => showPrompt() },
        { type: "separator" },
        { role: "reload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "quit" }
      ]
    }
  ]);

  Menu.setApplicationMenu(menu);
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
