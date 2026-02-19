const {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  Tray,
  Menu,
  screen,
  desktopCapturer,
  dialog,
  nativeImage,
} = require('electron');
const path = require('path');
const fs = require('fs');

let win;
let tray;
let drawingMode = false;

app.whenReady().then(() => {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { x, y, width, height } = primaryDisplay.bounds;

  win = new BrowserWindow({
    x,
    y,
    width,
    height,
    frame: false,
    transparent: true,
    hasShadow: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.setAlwaysOnTop(true, 'screen-saver');
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  // Start in pass-through mode
  setPassThrough(true);

  win.loadFile('overlay.html');

  // Global shortcut: Cmd+Shift+D to toggle drawing mode
  globalShortcut.register('CommandOrControl+Shift+D', () => {
    toggleDrawingMode();
  });

  createTray();
});

function toggleDrawingMode() {
  drawingMode = !drawingMode;
  setPassThrough(!drawingMode);
  win.webContents.send('mode-changed', drawingMode);
  updateTrayMenu();
}

function setPassThrough(passThrough) {
  if (passThrough) {
    win.setIgnoreMouseEvents(true);
    win.setFocusable(false);
  } else {
    win.setIgnoreMouseEvents(false);
    win.setFocusable(true);
    win.focus();
  }
}

function createTray() {
  // Use a simple dot icon for the tray
  const iconSize = 22;
  const canvas = { width: iconSize, height: iconSize };
  const img = nativeImage.createEmpty();

  // Create a small icon programmatically
  tray = new Tray(createTrayIcon());
  updateTrayMenu();
}

function createTrayIcon() {
  // 22x22 PNG with a circle drawn as annotation indicator
  const size = 32;
  const buf = Buffer.alloc(size * size * 4, 0);
  const cx = size / 2;
  const cy = size / 2;
  const r = 10;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      const idx = (y * size + x) * 4;
      if (dist <= r) {
        // Red circle
        buf[idx] = 255;     // R
        buf[idx + 1] = 107;  // G
        buf[idx + 2] = 107;  // B
        buf[idx + 3] = 255; // A
      }
    }
  }

  return nativeImage.createFromBuffer(buf, { width: size, height: size });
}

function updateTrayMenu() {
  if (!tray) return;
  const menu = Menu.buildFromTemplate([
    {
      label: drawingMode ? 'Exit Drawing Mode' : 'Enter Drawing Mode',
      accelerator: 'CommandOrControl+Shift+D',
      click: () => toggleDrawingMode(),
    },
    { type: 'separator' },
    {
      label: 'Clear Annotations',
      click: () => win.webContents.send('clear'),
    },
    {
      label: 'Save Screenshot',
      accelerator: 'CommandOrControl+S',
      click: () => win.webContents.send('take-screenshot'),
    },
    { type: 'separator' },
    {
      label: 'Quit',
      accelerator: 'CommandOrControl+Q',
      click: () => app.quit(),
    },
  ]);
  tray.setToolTip('Annotation Overlay');
  tray.setContextMenu(menu);
}

// IPC: exit drawing mode from renderer (Escape key)
ipcMain.on('exit-drawing-mode', () => {
  if (drawingMode) {
    drawingMode = false;
    setPassThrough(true);
    win.webContents.send('mode-changed', false);
    updateTrayMenu();
  }
});

// IPC: capture desktop screenshot
ipcMain.handle('capture-desktop', async () => {
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: screen.getPrimaryDisplay().size,
  });

  if (sources.length === 0) return null;
  return sources[0].thumbnail.toPNG();
});

// IPC: save screenshot file
ipcMain.handle('save-screenshot', async (_event, pngBuffer) => {
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    defaultPath: `annotation-${Date.now()}.png`,
    filters: [{ name: 'PNG Image', extensions: ['png'] }],
  });

  if (canceled || !filePath) return false;
  fs.writeFileSync(filePath, Buffer.from(pngBuffer));
  return true;
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  app.quit();
});
