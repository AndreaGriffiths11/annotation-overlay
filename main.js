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
let prefsWin;
let drawingMode = false;

const DEFAULT_SHORTCUTS = {
  toggle: 'CommandOrControl+Shift+D',
  pen: 'P',
  rect: 'R',
  arrow: 'A',
  highlighter: 'G',
  eraser: 'E',
  toolbar: 'H',
  clear: 'X',
  color: 'C',
  stroke: 'W',
  undo: 'CommandOrControl+Z',
  screenshot: 'CommandOrControl+S',
  quit: 'CommandOrControl+Q',
};
let shortcuts = { ...DEFAULT_SHORTCUTS };

function shortcutsFile() {
  return path.join(app.getPath('userData'), 'shortcuts.json');
}

function loadShortcuts() {
  try {
    const saved = JSON.parse(fs.readFileSync(shortcutsFile(), 'utf8'));
    for (const k of Object.keys(DEFAULT_SHORTCUTS)) {
      if (typeof saved[k] === 'string' && saved[k]) shortcuts[k] = saved[k];
    }
  } catch {
    // no saved file or invalid JSON: keep defaults
  }
}

function registerToggleShortcut(accelerator) {
  try {
    return globalShortcut.register(accelerator, toggleDrawingMode);
  } catch {
    return false;
  }
}

function applyShortcuts(next) {
  const keys = Object.keys(DEFAULT_SHORTCUTS);
  const clean = {};
  for (const k of keys) {
    if (typeof next[k] !== 'string' || !next[k]) return { ok: false, error: `Missing shortcut for ${k}` };
    clean[k] = next[k];
  }
  if (new Set(Object.values(clean)).size !== keys.length) {
    return { ok: false, error: 'Each action needs a different shortcut' };
  }

  if (clean.toggle !== shortcuts.toggle) {
    globalShortcut.unregister(shortcuts.toggle);
    if (!registerToggleShortcut(clean.toggle)) {
      registerToggleShortcut(shortcuts.toggle);
      return { ok: false, error: `Could not register ${clean.toggle} (already in use?)` };
    }
  }

  shortcuts = clean;
  fs.writeFileSync(shortcutsFile(), JSON.stringify(shortcuts, null, 2));
  win.webContents.send('shortcuts-changed', shortcuts);
  updateTrayMenu();
  return { ok: true, shortcuts };
}

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
  loadShortcuts();
  const bounds = getAllDisplaysBounds();

  win = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    frame: false,
    transparent: true,
    hasShadow: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true,
    fullscreenable: false,
    enableLargerThanScreen: true,
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
    // Force bounds after load — macOS can clamp transparent windows at creation
    win.setBounds(bounds);
    win.setResizable(false);
    // Re-apply pass-through since setBounds can reset mouse event state
    setPassThrough(!drawingMode);
    console.log('Overlay loaded — displays:', JSON.stringify(screen.getAllDisplays().map(d => d.bounds)));
    console.log('Window bounds:', JSON.stringify(win.getBounds()));
    console.log('Drawing mode:', drawingMode);
    // Tell the renderer where the primary display is relative to the window
    const primary = screen.getPrimaryDisplay().bounds;
    win.webContents.send('display-info', { primary, windowBounds: bounds });
    win.showInactive();
  });

  // Global shortcut to toggle drawing mode (default Cmd+Shift+D)
  const registered = registerToggleShortcut(shortcuts.toggle);
  console.log('Global shortcut registered:', registered);

  createTray();

  // Resize overlay when displays are added or removed
  function updateWindowBounds() {
    win.setResizable(true);
    win.setBounds(getAllDisplaysBounds());
    win.setResizable(false);
    setPassThrough(!drawingMode);
  }
  screen.on('display-added', updateWindowBounds);
  screen.on('display-removed', updateWindowBounds);
  screen.on('display-metrics-changed', updateWindowBounds);
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
    win.setIgnoreMouseEvents(true, { forward: true });
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
      accelerator: shortcuts.toggle,
      click: () => toggleDrawingMode(),
    },
    { type: 'separator' },
    {
      label: 'Clear Annotations',
      click: () => win.webContents.send('clear'),
    },
    {
      label: 'Save Screenshot',
      click: () => win.webContents.send('take-screenshot'),
    },
    { type: 'separator' },
    {
      label: 'Preferences',
      submenu: [
        { label: 'Customize Shortcuts…', click: () => openPreferences() },
        { type: 'separator' },
        { label: 'Quit', click: () => app.quit() },
      ],
    },
  ]);
  tray.setToolTip('Annotation Overlay');
  tray.setContextMenu(menu);
}

function openPreferences() {
  if (prefsWin && !prefsWin.isDestroyed()) {
    prefsWin.show();
    prefsWin.focus();
    return;
  }
  prefsWin = new BrowserWindow({
    width: 460,
    height: 760,
    title: 'Customize Shortcuts',
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  prefsWin.setMenu(null);
  // The overlay sits at 'screen-saver' level, so match it to stay visible
  prefsWin.setAlwaysOnTop(true, 'screen-saver');
  prefsWin.loadFile('preferences.html');
  prefsWin.on('closed', () => { prefsWin = null; });
}

ipcMain.handle('get-shortcuts', () => shortcuts);
ipcMain.handle('set-shortcuts', (_e, next) => applyShortcuts(next));
ipcMain.handle('reset-shortcuts', () => applyShortcuts(DEFAULT_SHORTCUTS));

// IPC: dynamically toggle mouse event pass-through (used to make pill clickable)
ipcMain.on('set-ignore-mouse-events', (_e, ignore, forward) => {
  if (drawingMode) return; // drawing mode always captures events
  win.setIgnoreMouseEvents(ignore, forward ? { forward: true } : undefined);
});

// IPC: exit drawing mode from renderer (Escape key)
ipcMain.on('exit-drawing-mode', () => {
  if (drawingMode) {
    drawingMode = false;
    setPassThrough(true);
    win.webContents.send('mode-changed', false);
    updateTrayMenu();
  }
});

ipcMain.on('enter-drawing-mode', () => {
  if (!drawingMode) {
    drawingMode = true;
    setPassThrough(false);
    win.webContents.send('mode-changed', true);
    updateTrayMenu();
  }
});

// IPC: quit app from renderer
ipcMain.on('quit-app', () => {
  app.quit();
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
