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
- ✅ **OpenCode Go**: Configure o plano Go da OpenCode para usar modelos abertos no OpenCode, Codex e Claude Code com um único endpoint compatível com OpenAI.
- ✅ Janela frameless com barra de título customizada
- ✅ Controles de janela (minimizar, maximizar/restaurar, fechar)
- ✅ Alternância de tema claro/escuro com persistência
- ✅ Atalho F12 para DevTools
- ✅ Interface moderna e responsiva com Tailwind CSS
- ✅ Build otimizado com Vite

## OpenCode Go

1. Abra `Configurações > Provedores`.
2. Clique em `Novo Provedor` e use o preset `OpenCode Go`.
3. Cole sua chave de API do OpenCode Zen.
4. Opcionalmente use `Buscar Modelos` para carregar a lista atual.
5. Selecione o provedor no workspace e escolha um modelo compatível.

Configuração usada pelo preset:

- Base URL: `https://opencode.ai/zen/go/v1`
- Endpoint de referência: `https://opencode.ai/zen/go/v1/chat/completions`
- Tipo de API: `Compatível com OpenAI`

O plano OpenCode Go custa US$ 5 no primeiro mês e depois US$ 10/mês. Os limites atuais são baseados em valor de uso: US$ 12 por janela de 5 horas, US$ 30 por semana e US$ 60 por mês, variando conforme o modelo escolhido.

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
