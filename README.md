# Code Workspace Orchestrator

Aplicativo desktop moderno construído com **Electron + React + Vite + Tailwind CSS**.

## 🚀 Funcionalidades

- ✅ Janela frameless com barra de título customizada
- ✅ Controles de janela (minimizar, maximizar/restaurar, fechar)
- ✅ Alternância de tema claro/escuro com persistência
- ✅ Atalho F12 para DevTools
- ✅ Interface moderna e responsiva com Tailwind CSS
- ✅ Build otimizado com Vite

## 📁 Estrutura do Projeto

```
DESK.CodeWorkspaceOrchestrator/
├── src/
│   ├── main/
│   │   └── main.js          # Electron main process
│   ├── preload/
│   │   └── preload.js       # Bridge segura IPC
│   └── renderer/
│       ├── components/
│       │   ├── TitleBar.jsx     # Barra de título customizada
│       │   └── ThemeToggle.jsx  # Toggle de tema
│       ├── styles/
│       │   └── index.css        # Estilos Tailwind
│       ├── App.jsx              # Componente principal
│       └── main.jsx             # Entry point React
├── index.html               # HTML base
├── vite.config.js           # Configuração Vite
├── tailwind.config.js       # Configuração Tailwind
├── postcss.config.js        # Configuração PostCSS
└── package.json             # Dependências e scripts
```

## 🛠️ Instalação

1. Instale as dependências:

```bash
npm install
```

## 🏃 Desenvolvimento

Execute o aplicativo em modo de desenvolvimento:

```bash
npm run dev
```

Este comando inicia:
- Servidor Vite (hot reload)
- Aplicação Electron

## 📦 Build

### Build do frontend (React)

```bash
npm run build
```

### Build do aplicativo Electron

```bash
npm run build:electron
```

Os arquivos de distribuição serão gerados na pasta `release/`.

## ⌨️ Atalhos

| Tecla | Ação |
|-------|------|
| `F12` | Abrir/Fechar DevTools |

## 🎨 Personalização

### Cores do Tema

Edite `tailwind.config.js` para personalizar as cores:

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

### Ícone do Aplicativo

Substitua os arquivos de ícone em `assets/`:
- `icon.ico` (Windows)
- `icon.icns` (macOS)
- `icon.png` (Linux)

## 📝 Tecnologias

- [Electron](https://www.electronjs.org/) - Framework para aplicativos desktop
- [React](https://react.dev/) - Biblioteca UI
- [Vite](https://vitejs.dev/) - Build tool moderna
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS utilitário

## 📄 Licença

MIT
