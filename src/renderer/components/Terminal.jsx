import { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

async function writeClipboardText(text) {
  if (!text) {
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    console.error('Erro ao copiar texto do terminal:', error);
  }
}

async function readClipboardText() {
  try {
    return await navigator.clipboard.readText();
  } catch (error) {
    console.error('Erro ao ler clipboard do terminal:', error);
    return '';
  }
}

export function Terminal({
  session,
  title,
  workspaceName,
  statusLabel,
  errorMessage = '',
  compact = false,
  embedded = false,
  showClear = true,
  zoomLevel = 0,
  onZoomIn,
  onZoomOut,
  onClose,
  onFocus,
  onSessionExit,
  onHeaderContextMenu,
  isActive = false,
}) {
  const containerRef = useRef(null);
  const terminalRef = useRef(null);
  const fitAddonRef = useRef(null);
  const wheelRemainderRef = useRef(0);
  const isActiveRef = useRef(isActive);
  const onFocusRef = useRef(onFocus);
  const [localError, setLocalError] = useState('');
  const baseFontSize = compact ? 11.5 : 13;

  const isTerminalFocused = (terminal) => {
    const activeElement = document.activeElement;
    if (!terminal || !activeElement) {
      return false;
    }

    return terminal.textarea === activeElement || Boolean(terminal.element?.contains(activeElement));
  };

  const focusTerminal = (terminal = terminalRef.current) => {
    if (!terminal) {
      onFocusRef.current?.();
      return;
    }

    const alreadyFocused = isTerminalFocused(terminal);
    if (!isActiveRef.current) {
      onFocusRef.current?.();
    }

    if (alreadyFocused) {
      return;
    }

    window.requestAnimationFrame(() => {
      if (!isTerminalFocused(terminal)) {
        terminal.focus();
      }
    });
  };

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    onFocusRef.current = onFocus;
  }, [onFocus]);

  useEffect(() => {
    if (!containerRef.current || !session?.sessionId) {
      return undefined;
    }

    wheelRemainderRef.current = 0;

    let terminal = null;
    let fitAddon = null;
    let resizeObserver = null;
    let inputDisposable = null;
    let contextMenuHandler = null;
    let wheelHandler = null;
    let unsubscribeData = () => {};
    let unsubscribeExit = () => {};
    let unsubscribeError = () => {};

    const handleResize = async () => {
      if (!fitAddon || !terminal) {
        return;
      }

      try {
        fitAddon.fit();
        await window.electronAPI?.terminal?.resize?.({
          sessionId: session.sessionId,
          cols: terminal.cols,
          rows: terminal.rows,
        });
      } catch (error) {
        setLocalError(error.message || 'Erro ao redimensionar terminal');
      }
    };

    try {
      terminal = new XTerm({
        allowTransparency: true,
        convertEol: false,
        cursorBlink: true,
        cursorStyle: 'block',
        fontFamily: 'Cascadia Code, Consolas, Monaco, monospace',
        fontSize: baseFontSize + zoomLevel,
        lineHeight: 1.35,
        scrollback: 4000,
        theme: {
          background: '#050505',
          foreground: '#d7dde7',
          black: '#111111',
          red: '#f87171',
          green: '#34d399',
          yellow: '#fbbf24',
          blue: '#60a5fa',
          magenta: '#f472b6',
          cyan: '#22d3ee',
          white: '#e5e7eb',
          brightBlack: '#6b7280',
          brightRed: '#fca5a5',
          brightGreen: '#6ee7b7',
          brightYellow: '#fcd34d',
          brightBlue: '#93c5fd',
          brightMagenta: '#f9a8d4',
          brightCyan: '#67e8f9',
          brightWhite: '#ffffff',
          cursor: '#ffffff',
          cursorAccent: '#050505',
          selectionBackground: 'rgba(148, 163, 184, 0.28)',
        },
      });
      fitAddon = new FitAddon();

      terminal.loadAddon(fitAddon);
      fitAddonRef.current = fitAddon;
      terminal.open(containerRef.current);
      terminal.write(session.buffer || '');
      fitAddon.fit();
      terminalRef.current = terminal;
      if (isActiveRef.current) {
        focusTerminal(terminal);
      }

      terminal.attachCustomKeyEventHandler((event) => {
        const isCopyShortcut = (event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey && event.key.toLowerCase() === 'c';
        const isPasteShortcut = (event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey && event.key.toLowerCase() === 'v';

        if (event.type !== 'keydown') {
          return true;
        }

        if (isCopyShortcut && terminal.hasSelection()) {
          void writeClipboardText(terminal.getSelection());
          event.preventDefault();
          return false;
        }

        if (isPasteShortcut) {
          event.preventDefault();
          void readClipboardText().then((text) => {
            if (!text) {
              return;
            }

            terminal.paste(text);
            focusTerminal(terminal);
          });
          return false;
        }

        return true;
      });

      terminal.attachCustomWheelEventHandler((event) => {
        focusTerminal(terminal);
        if (event.ctrlKey || event.metaKey) {
          return true;
        }
        return false;
      });

      contextMenuHandler = (event) => {
        event.preventDefault();

        if (terminal.hasSelection()) {
          void writeClipboardText(terminal.getSelection()).then(() => {
            focusTerminal(terminal);
          });
          return;
        }

        void readClipboardText().then((text) => {
          if (!text) {
            focusTerminal(terminal);
            return;
          }

          terminal.paste(text);
          focusTerminal(terminal);
        });
      };
      containerRef.current.addEventListener('contextmenu', contextMenuHandler);

      wheelHandler = (event) => {
        focusTerminal(terminal);

        if (event.ctrlKey || event.metaKey) {
          return;
        }

        const lineHeight = terminal.options.fontSize
          * (typeof terminal.options.lineHeight === 'number' ? terminal.options.lineHeight : 1.35);

        if (!lineHeight || Number.isNaN(lineHeight)) {
          return;
        }

        let deltaLines = 0;
        if (event.deltaMode === 1) {
          deltaLines = event.deltaY;
        } else if (event.deltaMode === 2) {
          deltaLines = event.deltaY * terminal.rows;
        } else {
          deltaLines = event.deltaY / lineHeight;
        }

        const totalLines = wheelRemainderRef.current + deltaLines;
        const wholeLines = totalLines > 0 ? Math.floor(totalLines) : Math.ceil(totalLines);
        wheelRemainderRef.current = totalLines - wholeLines;

        if (wholeLines === 0) {
          return;
        }

        event.preventDefault();
        terminal.scrollLines(wholeLines);
      };
      containerRef.current.addEventListener('wheel', wheelHandler, { passive: false });

      void window.electronAPI?.terminal?.resize?.({
        sessionId: session.sessionId,
        cols: terminal.cols,
        rows: terminal.rows,
      });

      inputDisposable = terminal.onData((data) => {
        void window.electronAPI?.terminal?.write?.({
          sessionId: session.sessionId,
          data,
        });
      });

      unsubscribeData = window.electronAPI?.terminal?.onData?.((payload) => {
        if (payload.sessionId !== session.sessionId) {
          return;
        }

        terminal.write(payload.data);
      }) || (() => {});

      unsubscribeExit = window.electronAPI?.terminal?.onExit?.((payload) => {
        if (payload.sessionId !== session.sessionId) {
          return;
        }

        terminal.writeln('');
        terminal.writeln(`\x1b[90mSessao encerrada (code ${payload.exitCode ?? 'n/a'})\x1b[0m`);
        onSessionExit?.(payload);
      }) || (() => {});

      unsubscribeError = window.electronAPI?.terminal?.onError?.((payload) => {
        if (payload.sessionId && payload.sessionId !== session.sessionId) {
          return;
        }

        const message = payload.message || 'Erro no terminal';
        setLocalError(message);
        terminal.writeln('');
        terminal.writeln(`\x1b[31m${message}\x1b[0m`);
      }) || (() => {});

      if (typeof ResizeObserver === 'function') {
        resizeObserver = new ResizeObserver(() => {
          void handleResize();
        });
        resizeObserver.observe(containerRef.current);
      } else {
        void handleResize();
      }
    } catch (error) {
      console.error('Erro ao inicializar terminal embutido:', error);
      setLocalError(error.message || 'Não foi possível inicializar o terminal');
    }

    return () => {
      resizeObserver?.disconnect();
      if (contextMenuHandler && containerRef.current) {
        containerRef.current.removeEventListener('contextmenu', contextMenuHandler);
      }
      if (wheelHandler && containerRef.current) {
        containerRef.current.removeEventListener('wheel', wheelHandler);
      }
      unsubscribeData();
      unsubscribeExit();
      unsubscribeError();
      inputDisposable?.dispose();
      terminal?.dispose();
      terminalRef.current = null;
      fitAddonRef.current = null;
    };
  }, [baseFontSize, onSessionExit, session?.sessionId]);

  useEffect(() => {
    const terminal = terminalRef.current;
    const fitAddon = fitAddonRef.current;
    if (!terminal || !fitAddon || !session?.sessionId) {
      return;
    }

    try {
      terminal.options.fontSize = baseFontSize + zoomLevel;
      fitAddon.fit();
      void window.electronAPI?.terminal?.resize?.({
        sessionId: session.sessionId,
        cols: terminal.cols,
        rows: terminal.rows,
      });
    } catch (error) {
      console.error('Erro ao atualizar zoom do terminal:', error);
      setLocalError(error.message || 'Erro ao atualizar zoom do terminal');
    }
  }, [baseFontSize, session?.sessionId, zoomLevel]);

  useEffect(() => {
    setLocalError(errorMessage || '');
  }, [errorMessage]);

  useEffect(() => {
    const terminal = terminalRef.current;
    const fitAddon = fitAddonRef.current;
    if (!isActive || !terminal || !fitAddon) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      try {
        fitAddon.fit();
        void window.electronAPI?.terminal?.resize?.({
          sessionId: session?.sessionId,
          cols: terminal.cols,
          rows: terminal.rows,
        });
      } catch (error) {
        console.error('Erro ao reajustar terminal ativo:', error);
      }

      if (!isTerminalFocused(terminal)) {
        terminal.focus();
      }
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [isActive, session?.sessionId]);

  const statusClassName =
    session?.status === 'exited'
      ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';

  return (
    <div
      className={`relative h-full min-h-0 overflow-hidden text-[color:var(--text-primary)] flex flex-col ${
        embedded
          ? 'bg-[color:var(--bg-surface)]'
          : 'border border-[color:var(--border-color)] bg-[color:var(--bg-surface)] shadow-sm'
      }`}
      onMouseDown={focusTerminal}
    >
      {!embedded && (
        <header
          className={`shrink-0 border-b border-[color:var(--border-color)] bg-[color:var(--bg-body)] ${compact ? 'px-3 py-2.5' : 'px-4 py-3'}`}
          onContextMenu={onHeaderContextMenu}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={`truncate font-semibold text-[color:var(--text-primary)] ${compact ? 'text-[0.75rem]' : 'text-[0.85rem]'}`}>
                  {title || workspaceName}
                </span>
                <span className={`rounded-full border px-2 py-0.5 uppercase tracking-wide ${statusClassName} ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
                  {statusLabel}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  onZoomOut?.();
                  focusTerminal();
                }}
                className={`rounded-[6px] border border-[color:var(--border-color)] bg-[color:var(--bg-surface)] text-[color:var(--text-secondary)] transition-colors hover:bg-[color:var(--bg-body)] hover:text-[color:var(--text-primary)] ${compact ? 'h-6 w-6 text-[0.75rem]' : 'h-7 w-7 text-[0.85rem]'} flex items-center justify-center font-semibold`}
                aria-label="Diminuir zoom do terminal"
                title="Diminuir zoom"
              >
                −
              </button>
              <button
                onClick={() => {
                  onZoomIn?.();
                  focusTerminal();
                }}
                className={`rounded-[6px] border border-[color:var(--border-color)] bg-[color:var(--bg-surface)] text-[color:var(--text-secondary)] transition-colors hover:bg-[color:var(--bg-body)] hover:text-[color:var(--text-primary)] ${compact ? 'h-6 w-6 text-[0.75rem]' : 'h-7 w-7 text-[0.85rem]'} flex items-center justify-center font-semibold`}
                aria-label="Aumentar zoom do terminal"
                title="Aumentar zoom"
              >
                +
              </button>
              {showClear && (
                <button
                  onClick={() => {
                    terminalRef.current?.clear();
                    focusTerminal();
                  }}
                  className={`rounded-[6px] border border-[color:var(--border-color)] bg-[color:var(--bg-surface)] text-[color:var(--text-secondary)] transition-colors hover:bg-[color:var(--bg-body)] hover:text-[color:var(--text-primary)] ${compact ? 'px-2 py-1 text-[0.65rem]' : 'px-2.5 py-1 text-[0.75rem]'}`}
                >
                  Limpar
                </button>
              )}
              <button
                onClick={onClose}
                className={`rounded-[6px] border border-[color:var(--danger-color)]/20 bg-[color:var(--danger-color)]/5 text-[color:var(--danger-color)] transition-colors hover:bg-[color:var(--danger-color)]/10 hover:text-[color:var(--danger-color)] ${compact ? 'px-2 py-1 text-[0.65rem]' : 'px-2.5 py-1 text-[0.75rem]'}`}
              >
                Encerrar
              </button>
            </div>
          </div>
        </header>
      )}

      {(localError || errorMessage) && (
        <div className="border-b border-red-500/20 bg-red-500/10 px-4 py-2 text-xs text-red-300">
          {localError || errorMessage}
        </div>
      )}

      <div className="flex-1 min-h-0 bg-[#050505] p-1">
        <div
          ref={containerRef}
          className="h-full w-full overflow-hidden"
        />
      </div>

      {embedded && (
        <div className="pointer-events-none absolute right-2 top-2 z-10 flex items-center gap-1">
          <button
            onClick={() => {
              onZoomOut?.();
              focusTerminal();
            }}
            className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-[6px] border border-[color:var(--border-color)] bg-[color:var(--bg-surface)] shadow-sm text-[0.85rem] font-semibold text-[color:var(--text-secondary)] transition-colors hover:bg-[color:var(--bg-body)] hover:text-[color:var(--text-primary)]"
            aria-label="Diminuir zoom do terminal"
            title="Diminuir zoom"
          >
            −
          </button>
          <button
            onClick={() => {
              onZoomIn?.();
              focusTerminal();
            }}
            className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-[6px] border border-[color:var(--border-color)] bg-[color:var(--bg-surface)] shadow-sm text-[0.85rem] font-semibold text-[color:var(--text-secondary)] transition-colors hover:bg-[color:var(--bg-body)] hover:text-[color:var(--text-primary)]"
            aria-label="Aumentar zoom do terminal"
            title="Aumentar zoom"
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}
