# Annotation Overlay

Draw over anything on your screen. Works during presentations, live demos, and screen sharing without switching windows or apps.

![Demo](assets/demo.gif)

## Install

No terminal needed.

Go to the [Releases](../../releases) page and download the installer for your platform:

| Platform | File | Size |
|---|---|---|
| macOS | [Annotation.Overlay-1.0.0-arm64.dmg](../../releases/download/v1.0.0/Annotation.Overlay-1.0.0-arm64.dmg) | 105 MB |
| Windows | [Annotation.Overlay.Setup.1.0.0.exe](../../releases/download/v1.0.0/Annotation.Overlay.Setup.1.0.0.exe) | 81 MB |
| Linux | [Annotation.Overlay-1.0.0.AppImage](../../releases/download/v1.0.0/Annotation.Overlay-1.0.0.AppImage) | 109 MB |

Open the installer and follow the prompts. Launch **Annotation Overlay** from Applications or your Start Menu.

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
| Highlighter | `G` | Semi-transparent wide stroke |
| Eraser | `E` | Click a stroke to delete it |

## Shortcuts

| Action | Mac | Windows / Linux |
|---|---|---|
| Toggle drawing mode | `Cmd+Shift+D` | `Ctrl+Shift+D` |
| Exit drawing mode | `Escape` | `Escape` |
| Color picker | `C` | `C` |
| Stroke width | `W` | `W` |
| Undo | `Cmd+Z` | `Ctrl+Z` |
| Clear all | `X` | `X` |
| Screenshot | `Cmd+S` | `Ctrl+S` |
| Hide/show toolbar | `H` | `H` |
| Quit | `Cmd+Q` | `Ctrl+Q` |

## Permissions

On macOS, the app needs **Screen Recording** permission to capture screenshots. If you haven't granted it, the app will prompt you when you try to save a screenshot. You can manage this in **System Settings > Privacy & Security > Screen Recording**.

## Tray Icon

Single-click the icon in the menu bar to toggle drawing mode on or off.

Right-click for quick access to toggle, clear, screenshot, and quit.

## Screenshots

`Cmd+S` captures your full desktop with annotations on top and saves it as a PNG.

## Browser Fallback

Open `overlay.html` directly in a browser for a basic annotation experience without the system-wide overlay.

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) to get started.

## License

[MIT](LICENSE)
