# Contributing to Annotation Overlay

Thanks for your interest in contributing! This guide will help you get started.

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/<your-username>/annotation-overlay.git
   cd annotation-overlay
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the app:
   ```bash
   npm start
   ```

## Development

The project structure is straightforward:

- `main.js` — Electron main process (window management, tray, global shortcuts, IPC)
- `overlay.html` — Renderer with the canvas-based annotation UI
- `preload.js` — Secure bridge between main and renderer processes

### Making Changes

1. Create a branch for your work:
   ```bash
   git checkout -b my-feature
   ```
2. Make your changes
3. Test manually by running `npm start` and verifying the overlay works correctly
4. Commit with a clear, descriptive message:
   ```bash
   git commit -m "Add support for circle tool"
   ```

## Submitting a Pull Request

1. Push your branch to your fork:
   ```bash
   git push origin my-feature
   ```
2. Open a Pull Request against the `main` branch
3. Describe what your PR does and why
4. Link any related issues

## Guidelines

- Keep PRs focused — one feature or fix per PR
- Test your changes on your platform before submitting
- Follow the existing code style
- Commit messages should be clear and descriptive

## Reporting Bugs

Open an issue with:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Your OS and Electron version (`npm start` prints the version)

## Feature Requests

Open an issue describing:
- The problem you're trying to solve
- Your proposed solution
- Any alternatives you've considered

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
