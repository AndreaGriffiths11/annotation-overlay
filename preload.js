const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onModeChanged: (callback) => ipcRenderer.on('mode-changed', (_e, drawing) => callback(drawing)),
  onDisplayInfo: (callback) => ipcRenderer.on('display-info', (_e, info) => callback(info)),
  onClear: (callback) => ipcRenderer.on('clear', () => callback()),
  onTakeScreenshot: (callback) => ipcRenderer.on('take-screenshot', () => callback()),
  exitDrawingMode: () => ipcRenderer.send('exit-drawing-mode'),
  enterDrawingMode: () => ipcRenderer.send('enter-drawing-mode'),
  captureDesktop: () => ipcRenderer.invoke('capture-desktop'),
  saveScreenshot: (pngBuffer) => ipcRenderer.invoke('save-screenshot', pngBuffer),
  quitApp: () => ipcRenderer.send('quit-app'),
});
