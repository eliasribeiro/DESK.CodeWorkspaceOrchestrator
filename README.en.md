<div align="center">
  <a href="README.md">🇧🇷 Português</a> |
  <a href="README.en.md">🇺🇸 English</a> |
  <a href="README.es.md">🇪🇸 Español</a>
</div>

# Code Workspace Orchestrator

This is a desktop application to manage terminal coding environments (CLI) such as Claude Code, Codex CLI, Gemini CLI, Qwen CLI, and OpenCode. It integrates with Git worktree so you can increase your productivity by opening multiple terminals and worktrees for parallel development of features in your projects.

Modern desktop application built with **Electron + React + Vite + Tailwind CSS**.

## 🌐 Multi-language Support

The application interface natively supports 3 languages. You can read the documentation in your preferred language:
- [🇺🇸 English](README.en.md)
- [🇧🇷 Portuguese](README.md)
- [🇪🇸 Spanish](README.es.md)

## 🚀 Features

- ✅ **Multiple AI Providers**: Easily connect to various providers (OpenAI, Anthropic, Ollama, etc) and manage your models all in a single interface.
- ✅ **OpenCode Go**: Configure OpenCode's Go plan to use open coding models with OpenCode, Codex, and Claude Code from a single OpenAI-compatible endpoint.
- ✅ Frameless window with custom title bar
- ✅ Window controls (minimize, maximize/restore, close)
- ✅ Light/dark theme toggle with persistence
- ✅ F12 shortcut for DevTools
- ✅ Modern and responsive interface with Tailwind CSS
- ✅ Optimized build with Vite

## OpenCode Go

1. Open `Settings > Providers`.
2. Click `New Provider` and use the `OpenCode Go` preset.
3. Paste your API key from OpenCode Zen.
4. Optionally use `Fetch Models` to load the current catalog.
5. Select the provider in the workspace and pick a compatible model.

Preset values:

- Base URL: `https://opencode.ai/zen/go/v1`
- Reference endpoint: `https://opencode.ai/zen/go/v1/chat/completions`
- API type: `OpenAI-compatible`

## 📁 Project Structure

```
DESK.CodeWorkspaceOrchestrator/
├── src/
│   ├── main/
│   │   └── main.js          # Electron main process
│   ├── preload/
│   │   └── preload.js       # Secure IPC bridge
│   └── renderer/
│       ├── components/
│       │   ├── TitleBar.jsx     # Custom title bar
│       │   └── ThemeToggle.jsx  # Theme toggle
│       ├── styles/
│       │   └── index.css        # Tailwind styles
│       ├── App.jsx              # Main React component
│       └── main.jsx             # React entry point
├── index.html               # Base HTML
├── vite.config.js           # Vite configuration
├── tailwind.config.js       # Tailwind configuration
├── postcss.config.js        # PostCSS configuration
└── package.json             # Dependencies and scripts
```

## 🛠️ Installation

1. Install dependencies:

```bash
npm install
```

## 🏃 Development

Run the application in development mode:

```bash
npm run dev
```

This command starts:
- Vite server (hot reload)
- Electron application

## 📦 Build

### Frontend build (React)

```bash
npm run build
```

### Electron application build

```bash
npm run build:electron
```

Distribution files will be generated in the `release/` folder.

## ⌨️ Shortcuts

| Key | Action |
|-------|------|
| `F12` | Open/Close DevTools |

## 🎨 Customization

### Theme Colors

Edit `tailwind.config.js` to customize colors:

```js
theme: {
  extend: {
    colors: {
      primary: { /* ... */ },
      background: { /* ... */ },
      surface: { /* ... */ },
    },
  },
}
```

### Application Icon

Replace icon files in `assets/`:
- `icon.ico` (Windows)
- `icon.icns` (macOS)
- `icon.png` (Linux)

## 📝 Technologies

- [Electron](https://www.electronjs.org/) - Framework for desktop applications
- [React](https://react.dev/) - UI Library
- [Vite](https://vitejs.dev/) - Modern build tool
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

## 📄 License

MIT
