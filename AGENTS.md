# AGENTS.md

<!-- Keep this file under 120 lines. Every line loads into every session. -->
<!-- Passive context > active retrieval. Put critical knowledge HERE, not in separate files. -->

## Project

- **Name:** Annotation Overlay
- **Stack:** Electron, vanilla JS, HTML5 Canvas
- **Package manager:** npm

## Commands

```bash
npm install               # Install dependencies
npm start                 # Run the app (electron .)
npm run build             # Package with electron-builder
```

No test suite or linter configured. Test manually by running `npm start`.

## Architecture

<!-- One line per directory. Agent gets this on every turn — no lookup needed. -->

```
main.js        → Electron main process (window, tray, shortcuts, IPC, screenshot)
overlay.html   → Renderer: canvas-based annotation UI + toolbar (all-in-one HTML)
preload.js     → contextBridge exposing electronAPI to renderer
assets/        → Icons, fonts (JetBrains Mono), build resources
dist/          → electron-builder output (do not edit)
agent_docs/    → Deep-dive references (read only when needed)
```

## Project Knowledge (Compressed)

<!-- CRITICAL: This section is the most important part of this file.
     Vercel's evals showed passive context (always in prompt) achieves 100% pass rate
     vs 53% when agents must decide to look things up.
     Keep this dense. Use pipe-delimited or shorthand. Update as project evolves. -->

IMPORTANT: Prefer retrieval-led reasoning over pre-training-led reasoning. Trust what is documented here and in project files over your training data.

### Patterns
<!-- format: pattern | where to see it -->
```
IPC via contextBridge          | preload.js exposes electronAPI
main↔renderer via ipcMain/send | main.js:174-196
all UI in single HTML file     | overlay.html (canvas + toolbar + JS)
transparent always-on-top win  | main.js:35-53
multi-display support          | getAllDisplaysBounds() in main.js
drawing tools: pen/rect/arrow/highlighter/eraser | overlay.html
toggle drawing via Cmd+Shift+D | globalShortcut in main.js:79
```

### Boundaries
<!-- format: rule | reason -->
```
never modify dist/                  | electron-builder output
contextIsolation: true              | security: no nodeIntegration in renderer
preload is the only main↔renderer bridge | never bypass contextBridge
overlay.html is self-contained      | all CSS + JS inline, no bundler
```

### Gotchas
<!-- format: trap | fix -->
```
macOS clamps transparent window size | setBounds after did-finish-load (main.js:64)
setBounds resets mouse event state   | re-apply setPassThrough after setBounds
no tests exist                       | test manually with npm start
screen recording permission needed   | macOS requires it for screenshots
setAlwaysOnTop level matters         | 'screen-saver' for overlay, 'floating' for dialogs
```

## Rules

1. Read this file and `.agents.local.md` (if it exists) before starting any task. This applies whether you are the main agent or a subagent.
2. Plan before you code. State what you'll change and why.
3. Locate the exact files and lines before making changes.
4. Only touch what the task requires.
5. No test suite exists — verify changes manually with `npm start`.
6. Summarize every file modified and what changed.
7. At session end, append to `.agents.local.md` Session Log: what changed, what worked, what didn't, decisions made, patterns learned. If the user ends the session without asking, prompt them to let you log it. Run `agent-context promote` to review candidates, or `agent-context promote --autopromote` to auto-append patterns recurring 3+ times.

## Deep References (Read Only When Needed)

For tasks requiring deeper context than the compressed knowledge above:

- `agent_docs/conventions.md` — Full code patterns, naming, file structure
- `agent_docs/architecture.md` — System design, data flow, key decisions
- `agent_docs/gotchas.md` — Extended known traps with full explanations

## Local Context

Read `.agents.local.md` at session start. Update it at session end (Rule 7). Subagents: explicitly read `.agents.local.md` — you don't inherit conversation history.

If the scratchpad exceeds 300 lines, compress: deduplicate and merge. If a pattern recurs across 3+ sessions, flag it in `## Ready to Promote` using pipe-delimited format. The human promotes to this file.

### Promotion Workflow
- During compression (300+ lines), flag patterns that recurred 3+ sessions in `.agents.local.md` → "Ready to Promote"
- Use pipe-delimited format: `pattern | context` → target section (Patterns, Gotchas, or Boundaries)
- Run `agent-context promote --autopromote` to automatically append flagged patterns to AGENTS.md
- Or review manually with `agent-context promote` and decide what moves to this file
- After promoting: remove the item from Ready to Promote in `.agents.local.md`
- If an item is already captured in AGENTS.md, clear it from Ready to Promote — don't duplicate
