<div align="center">
  <a href="README.md">🇧🇷 Português</a> |
  <a href="README.en.md">🇺🇸 English</a> |
  <a href="README.es.md">🇪🇸 Español</a>
</div>

# Code Workspace Orchestrator

Esse é um aplicativo desktop para gerenciar ambientes de codificação de terminal (CLI) como Claude Code, Codex CLI, Gemini CLI, Qwen CLI, OpenCode integrados ao Git worktree de forma que você consiga aumentar sua produtividade abrindo vários terminais e worktrees para desenvolvimento em paralelo de funcionalidades nos seus projetos.

Aplicativo desktop moderno construído com **Electron + React + Vite + Tailwind CSS**.

## 🌐 Suporte a Múltiplos Idiomas

A interface do aplicativo suporta nativamente 3 idiomas. Você pode ler a documentação no seu idioma preferido:
- [🇺🇸 Inglês (English)](README.en.md)
- [🇧🇷 Português (Português)](README.md)
- [🇪🇸 Espanhol (Español)](README.es.md)

## 🚀 Funcionalidades

- ✅ **Múltiplos Provedores de IA**: Conecte-se facilmente a diversos provedores (OpenAI, Anthropic, Ollama, etc) e gerencie os seus modelos em uma única interface.
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
