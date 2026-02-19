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
    fullscreenable: false,
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

  win.webContents.on('did-finish-load', () => {
    console.log('Overlay loaded — press Cmd+Shift+D to draw');
    win.showInactive();
  });

  // Global shortcut: Cmd+Shift+D to toggle drawing mode
  const registered = globalShortcut.register('CommandOrControl+Shift+D', () => {
    toggleDrawingMode();
  });
  console.log('Global shortcut registered:', registered);

  createTray();
});

function toggleDrawingMode() {
  drawingMode = !drawingMode;
  console.log('Drawing mode:', drawingMode);
  setPassThrough(!drawingMode);
  win.webContents.send('mode-changed', drawingMode);
  updateTrayMenu();
}

function setPassThrough(passThrough) {
  if (passThrough) {
    win.setIgnoreMouseEvents(true);
  } else {
    win.setIgnoreMouseEvents(false);
    win.focus();
  }
}

function createTray() {
  tray = new Tray(createTrayIcon());
  tray.on('click', () => toggleDrawingMode());
  updateTrayMenu();
}

function createTrayIcon() {
  const size = 22;
  const buf = Buffer.alloc(size * size * 4, 0);
  const cx = size / 2;
  const cy = size / 2;
  const r = 8;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      const idx = (y * size + x) * 4;
      if (dist <= r) {
        buf[idx] = 255;
        buf[idx + 1] = 107;
        buf[idx + 2] = 107;
        buf[idx + 3] = 255;
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
