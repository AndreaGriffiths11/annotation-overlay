<img width="400" height="400" alt="Annotation Overlay logo" src="https://github.com/user-attachments/assets/ea022d82-5e14-4983-93ed-9b7bb607d2ea" />


A system-wide screen annotation tool built with Electron. Draw over any app on your screen during presentations and screen sharing.

## Install (One-Click)

You do **not** need terminal commands to use this app.

1. Open this repository on GitHub and go to the **Releases** page.
2. Download the installer for your OS:
   - macOS: `.dmg`
   - Windows: `.exe`
   - Linux: `.AppImage` (or `.deb` when available)
3. Open the downloaded installer and finish installation.
4. Launch **Annotation Overlay** from Applications / Start Menu like any other app.

## Quick Start

```bash
npm install
npm start
```

Press `Cmd+Shift+D` (or `Ctrl+Shift+D` on Windows/Linux) to toggle drawing mode on and off from any app.

## Usage

When drawing mode is **off**, clicks pass through to your apps underneath — annotations stay visible but don't block anything.

When drawing mode is **on**, the toolbar appears and you can draw freely over everything on screen.

### Tools

| Tool | Shortcut | Description |
|---|---|---|
| Pen | `P` | Freehand drawing |
| Rectangle | `R` | Drag to draw a rectangle |
| Arrow | `A` | Drag to draw an arrow |
| Text | `T` | Click to place text, Enter to commit |
| Highlighter | `G` | Semi-transparent wide stroke |
| Eraser | `E` | Click on a stroke to delete it |

### Other Shortcuts

| Action | Shortcut |
|---|---|
| Toggle drawing mode | `Cmd+Shift+D` |
| Exit drawing mode | `Escape` |
| Color picker | `C` |
| Stroke width | `W` |
| Undo | `Cmd+Z` |
| Clear all | `X` |
| Screenshot | `Cmd+S` |
| Hide/show toolbar | `H` |

### Tray Icon

Single-click the red dot in the menu bar to toggle drawing mode on or off instantly.

Right-click the red dot in the menu bar for quick access to toggle, clear, screenshot, and quit.

### Screenshot

`Cmd+S` captures the desktop with your annotations composited on top and saves it as a PNG.

## Browser Fallback

You can still open `overlay.html` directly in a browser for a basic annotation experience without the system-wide overlay.

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to get started.

## Publishing Releases (Maintainers)

When you push a version tag (for example `v1.0.1`), GitHub Actions will build installers and attach them to a GitHub Release.

```bash
git tag v1.0.1
git push origin v1.0.1
```

## License

This project is licensed under the [MIT License](LICENSE).
