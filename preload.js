const { contextBridge, ipcRenderer } = require('electron');

function onChannel(channel, handler) {
  ipcRenderer.removeAllListeners(channel);
  ipcRenderer.on(channel, handler);
}

contextBridge.exposeInMainWorld('electronAPI', {
  onModeChanged: (callback) => onChannel('mode-changed', (_e, drawing) => callback(drawing)),
  onDisplayInfo: (callback) => onChannel('display-info', (_e, info) => callback(info)),
  onShortcutsChanged: (callback) => onChannel('shortcuts-changed', (_e, map) => callback(map)),
  getShortcuts: () => ipcRenderer.invoke('get-shortcuts'),
  setShortcuts: (map) => ipcRenderer.invoke('set-shortcuts', map),
  resetShortcuts: () => ipcRenderer.invoke('reset-shortcuts'),
  onClear: (callback) => onChannel('clear', () => callback()),
  onTakeScreenshot: (callback) => onChannel('take-screenshot', () => callback()),
  exitDrawingMode: () => ipcRenderer.send('exit-drawing-mode'),
  enterDrawingMode: () => ipcRenderer.send('enter-drawing-mode'),
  captureDesktop: () => ipcRenderer.invoke('capture-desktop'),
  saveScreenshot: (pngBuffer) => ipcRenderer.invoke('save-screenshot', pngBuffer),
  quitApp: () => ipcRenderer.send('quit-app'),
  setIgnoreMouseEvents: (ignore, forward) => ipcRenderer.send('set-ignore-mouse-events', ignore, forward),
});
