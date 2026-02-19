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

function getAllDisplaysBounds() {
  const displays = screen.getAllDisplays();
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const d of displays) {
    minX = Math.min(minX, d.bounds.x);
    minY = Math.min(minY, d.bounds.y);
    maxX = Math.max(maxX, d.bounds.x + d.bounds.width);
    maxY = Math.max(maxY, d.bounds.y + d.bounds.height);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

app.whenReady().then(() => {
  const { x, y, width, height } = getAllDisplaysBounds();

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

  // Resize overlay when displays are added or removed
  screen.on('display-added', () => {
    win.setBounds(getAllDisplaysBounds());
  });
  screen.on('display-removed', () => {
    win.setBounds(getAllDisplaysBounds());
  });
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
  // Hide overlay so the capture is a clean desktop (no annotations or toolbar)
  win.setOpacity(0);
  await new Promise(resolve => setTimeout(resolve, 200));

  try {
    const displays = screen.getAllDisplays();
    const maxSize = displays.reduce(
      (acc, d) => ({
        width: Math.max(acc.width, d.size.width),
        height: Math.max(acc.height, d.size.height),
      }),
      { width: 0, height: 0 }
    );

    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: maxSize,
    });

    if (sources.length === 0) return null;

    // Single display: return PNG buffer directly
    if (sources.length === 1) {
      return sources[0].thumbnail.toPNG();
    }

    // Multi-display: return each capture with its display bounds
    const captures = [];
    for (const source of sources) {
      const display = displays.find(d => String(d.id) === String(source.display_id));
      if (display) {
        captures.push({
          png: source.thumbnail.toPNG(),
          bounds: display.bounds,
        });
      }
    }
    return { captures, unionBounds: getAllDisplaysBounds() };
  } finally {
    win.setOpacity(1);
  }
});

// IPC: save screenshot file
ipcMain.handle('save-screenshot', async (_event, pngBuffer) => {
  // Lower the overlay so the save dialog is visible above it
  win.setAlwaysOnTop(true, 'floating');

  try {
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      defaultPath: `annotation-${Date.now()}.png`,
      filters: [{ name: 'PNG Image', extensions: ['png'] }],
    });

    if (canceled || !filePath) return false;
    fs.writeFileSync(filePath, Buffer.from(pngBuffer));
    return true;
  } finally {
    win.setAlwaysOnTop(true, 'screen-saver');
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  app.quit();
});
