# Annotation Overlay

Draw over anything on your screen. Works during presentations, live demos, and screen sharing without switching windows or apps.

## Install

No terminal needed.

1. Go to the [Releases](../../releases) page.
2. Download the installer for your OS:
   - macOS: `.dmg`
   - Windows: `.exe`
   - Linux: `.AppImage`
3. Open the installer and follow the prompts.
4. Launch **Annotation Overlay** from Applications or your Start Menu.

## For Developers

```bash
npm install
npm start
```

## How It Works

The overlay sits on top of every window on your screen.

When drawing mode is **off**, clicks pass through to whatever is underneath. Your annotations stay visible but stay out of the way.

When drawing mode is **on**, the toolbar appears and you can draw freely.

Toggle with `Cmd+Shift+D` on Mac or `Ctrl+Shift+D` on Windows and Linux.

## Tools

| Tool | Shortcut | What It Does |
|---|---|---|
| Pen | `P` | Freehand drawing |
| Rectangle | `R` | Drag to draw a rectangle |
| Arrow | `A` | Drag to draw an arrow |
| Text | `T` | Click to place text, Enter to commit |
| Highlighter | `G` | Semi-transparent wide stroke |
| Eraser | `E` | Click a stroke to delete it |

## Shortcuts

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

## Tray Icon

Single-click the icon in the menu bar to toggle drawing mode on or off.

Right-click for quick access to toggle, clear, screenshot, and quit.

## Screenshots

`Cmd+S` captures your full desktop with annotations on top and saves it as a PNG.

## Browser Fallback

Open `overlay.html` directly in a browser for a basic annotation experience without the system-wide overlay.

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) to get started.

## Publishing a Release

Push a version tag and GitHub Actions builds installers for Mac, Windows, and Linux and attaches them to a GitHub Release automatically.

```bash
git tag v1.0.1
git push origin v1.0.1
```

## License

[MIT](LICENSE)
