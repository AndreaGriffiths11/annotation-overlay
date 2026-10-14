# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install     # install dependencies
npm start       # run the app (electron .)
npm run build   # package with electron-builder (output in dist/, do not edit)
```

There is no test suite or linter; verify changes manually with `npm start`. CI (`.github/workflows/ci.yml`) only runs `npm ci` and `npm run build -- --dir --publish never` to validate packaging. `overlay.html` can also be opened directly in a browser (it checks `window.electronAPI` and falls back to a basic mode).

## Architecture

Electron app (vanilla JS, HTML5 Canvas, no bundler) with three files:

- `main.js` — main process. Creates one frameless, transparent, always-on-top window spanning the union of all displays (`getAllDisplaysBounds()`), plus the tray icon (generated in code), the global `CommandOrControl+Shift+D` shortcut, and IPC handlers.
- `preload.js` — the only bridge between processes. Exposes `window.electronAPI` via `contextBridge` (`contextIsolation: true`, no `nodeIntegration`). New IPC needs a handler in `main.js` and a method here.
- `overlay.html` — the entire renderer: CSS, toolbar and canvas drawing logic inline in one file. Tools are pen/rect/arrow/highlighter/eraser; strokes are kept as objects (for undo and eraser hit-testing) and redrawn on `redraw()`.

### Drawing mode vs pass-through

`drawingMode` state lives in `main.js`. When off, the window ignores mouse events (`setIgnoreMouseEvents(true, {forward: true})`) so clicks reach apps underneath; annotations stay visible. When on, the window captures input and takes focus. The renderer is told via the `mode-changed` event, and can request changes via `enter-drawing-mode` / `exit-drawing-mode` (Escape). The `set-ignore-mouse-events` IPC lets the renderer make the "Annotate" pill clickable while in pass-through; it is ignored when drawing mode is on.

### Customizable shortcuts

`DEFAULT_SHORTCUTS` in `main.js` is the single map of action → Electron accelerator string; user overrides persist in `shortcuts.json` under `app.getPath('userData')`. Only `toggle` is a real global shortcut (re-registered in `applyShortcuts`); the rest are matched in `overlay.html`'s `keydown` handler via `eventToAccelerator()` and an `actions` table. The tray menu's Preferences → Customize Shortcuts… opens `preferences.html` (second `BrowserWindow`, same preload). `eventToAccelerator()` is duplicated in `overlay.html` and `preferences.html` (no bundler), so keep them in sync. Escape is fixed.

### Screenshots

The `capture-desktop` IPC sets window opacity to 0, grabs each screen via `desktopCapturer`, and returns either a single PNG buffer or `{captures, unionBounds}` for multi-display. The renderer composites annotations on top and sends the PNG to `save-screenshot`, which shows a save dialog. macOS needs Screen Recording permission.

## Gotchas

- macOS can clamp transparent window size at creation, so bounds are re-applied with `setBounds` after `did-finish-load` and on display add/remove/metrics-change.
- `setBounds` resets mouse-event state; always re-call `setPassThrough(!drawingMode)` afterwards.
- Always-on-top level matters: `'screen-saver'` for the overlay, temporarily `'floating'` while the save dialog is shown so it appears above the overlay.
- The renderer is told the primary display position relative to the window via the `display-info` event (needed for toolbar placement on multi-display setups).
- `AGENTS.md` references `agent_docs/` and `.agents.local.md`; neither exists in the repo (`.agents.local.md` is gitignored).
