<div align="center">
  <a href="README.md">🇧🇷 Português</a> |
  <a href="README.en.md">🇺🇸 English</a> |
  <a href="README.es.md">🇪🇸 Español</a>
</div>

# Code Workspace Orchestrator

Esta es una aplicación de escritorio para administrar entornos de codificación de terminal (CLI) como Claude Code, Codex CLI, Gemini CLI, Qwen CLI y OpenCode. Se integra con Git worktree para que puedas aumentar tu productividad abriendo varias terminales y worktrees para el desarrollo en paralelo de funcionalidades en tus proyectos.

Aplicación de escritorio moderna construida con **Electron + React + Vite + Tailwind CSS**.

## 🌐 Soporte Multilingüe

La interfaz de la aplicación soporta de forma nativa 3 idiomas. Puedes leer la documentación en tu idioma preferido:
- [🇺🇸 Inglés](README.en.md)
- [🇧🇷 Portugués](README.md)
- [🇪🇸 Español](README.es.md)

## 🚀 Funcionalidades

- ✅ **Múltiples Proveedores de IA**: Conéctate fácilmente a varios proveedores (OpenAI, Anthropic, Ollama, etc.) y administra tus modelos, todo en una única interfaz.
- ✅ **OpenCode Go**: Configura el plan Go de OpenCode para usar modelos abiertos en OpenCode, Codex y Claude Code desde un único endpoint compatible con OpenAI.
- ✅ Ventana sin bordes con barra de título personalizada
- ✅ Controles de ventana (minimizar, maximizar/restaurar, cerrar)
- ✅ Cambio de tema claro/oscuro con persistencia
- ✅ Atajo F12 para DevTools
- ✅ Interfaz moderna y responsiva con Tailwind CSS
- ✅ Build optimizado con Vite

## OpenCode Go

1. Abre `Configuración > Proveedores`.
2. Haz clic en `Nuevo Proveedor` y usa el preset `OpenCode Go`.
3. Pega tu API key desde OpenCode Zen.
4. Opcionalmente usa `Buscar Modelos` para cargar el catálogo actual.
5. Selecciona el proveedor en el workspace y elige un modelo compatible.

Valores del preset:

- Base URL: `https://opencode.ai/zen/go/v1`
- Endpoint de referencia: `https://opencode.ai/zen/go/v1/chat/completions`
- Tipo de API: `Compatible con OpenAI`

## 📁 Estructura del Proyecto

```
DESK.CodeWorkspaceOrchestrator/
├── src/
│   ├── main/
│   │   └── main.js          # Proceso principal de Electron
│   ├── preload/
│   │   └── preload.js       # Puente seguro IPC
│   └── renderer/
│       ├── components/
│       │   ├── TitleBar.jsx     # Barra de título personalizada
│       │   └── ThemeToggle.jsx  # Cambio de tema
│       ├── styles/
│       │   └── index.css        # Estilos Tailwind
│       ├── App.jsx              # Componente principal de React
│       └── main.jsx             # Punto de entrada de React
├── index.html               # HTML base
├── vite.config.js           # Configuración de Vite
├── tailwind.config.js       # Configuración de Tailwind
├── postcss.config.js        # Configuración de PostCSS
└── package.json             # Dependencias y scripts
```

## 🛠️ Instalación

1. Instalar las dependencias:

```bash
npm install
```

## 🏃 Desarrollo

Ejecuta la aplicación en modo de desarrollo:

```bash
npm run dev
```

Este comando inicia:
- Servidor Vite (hot reload)
- Aplicación Electron

## 📦 Build

### Build del frontend (React)

```bash
npm run build
```

### Build de la aplicación Electron

```bash
npm run build:electron
```

Los archivos de distribución se generarán en la carpeta `release/`.

## ⌨️ Atajos

| Tecla | Acción |
|-------|------|
| `F12` | Abrir/Cerrar DevTools |

## 🎨 Personalización

### Colores del Tema

Edita `tailwind.config.js` para personalizar los colores:

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

### Icono de la Aplicación

Reemplaza los archivos de iconos en `assets/`:
- `icon.ico` (Windows)
- `icon.icns` (macOS)
- `icon.png` (Linux)

## 📝 Tecnologías

- [Electron](https://www.electronjs.org/) - Framework para aplicaciones de escritorio
- [React](https://react.dev/) - Biblioteca UI
- [Vite](https://vitejs.dev/) - Herramienta de build moderna
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS de utilidades

## 📄 Licencia

MIT
