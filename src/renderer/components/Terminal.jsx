import { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

export function Terminal({
  session,
  title,
  workspaceName,
  workspacePath,
  statusLabel,
  errorMessage = '',
  compact = false,
  onClose,
  onFocus,
  onSessionExit,
}) {
  const containerRef = useRef(null);
  const terminalRef = useRef(null);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (!containerRef.current || !session?.sessionId) {
      return undefined;
    }

    const terminal = new XTerm({
      allowTransparency: true,
      convertEol: false,
      cursorBlink: true,
      cursorStyle: 'block',
      fontFamily: 'Cascadia Code, Consolas, Monaco, monospace',
      fontSize: compact ? 11.5 : 13,
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
    const fitAddon = new FitAddon();
    const resizeObserver = new ResizeObserver(async () => {
      try {
        fitAddon.fit();
        await window.electronAPI.terminal.resize({
          sessionId: session.sessionId,
          cols: terminal.cols,
          rows: terminal.rows,
        });
      } catch (error) {
        setLocalError(error.message || 'Erro ao redimensionar terminal');
      }
    });

    terminal.loadAddon(fitAddon);
    terminal.open(containerRef.current);
    terminal.write(session.buffer || '');
    fitAddon.fit();
    terminal.focus();
    terminalRef.current = terminal;

    window.electronAPI.terminal.resize({
      sessionId: session.sessionId,
      cols: terminal.cols,
      rows: terminal.rows,
    });

    const inputDisposable = terminal.onData((data) => {
      window.electronAPI.terminal.write({
        sessionId: session.sessionId,
        data,
      });
    });

    const unsubscribeData = window.electronAPI.terminal.onData((payload) => {
      if (payload.sessionId !== session.sessionId) {
        return;
      }

      terminal.write(payload.data);
    });

    const unsubscribeExit = window.electronAPI.terminal.onExit((payload) => {
      if (payload.sessionId !== session.sessionId) {
        return;
      }

      terminal.writeln('');
      terminal.writeln(`\x1b[90mSessao encerrada (code ${payload.exitCode ?? 'n/a'})\x1b[0m`);
      onSessionExit?.(payload);
    });

    const unsubscribeError = window.electronAPI.terminal.onError((payload) => {
      if (payload.sessionId && payload.sessionId !== session.sessionId) {
        return;
      }

      const message = payload.message || 'Erro no terminal';
      setLocalError(message);
      terminal.writeln('');
      terminal.writeln(`\x1b[31m${message}\x1b[0m`);
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      unsubscribeData();
      unsubscribeExit();
      unsubscribeError();
      inputDisposable.dispose();
      terminal.dispose();
      terminalRef.current = null;
    };
  }, [compact, onSessionExit, session?.sessionId]);

  useEffect(() => {
    setLocalError(errorMessage || '');
  }, [errorMessage]);

  const statusClassName =
    session?.status === 'exited'
      ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';

  return (
    <div
      className={`h-full min-h-0 overflow-hidden rounded-[24px] border border-white/10 bg-[#0A0A0A] text-slate-300 shadow-[0_24px_80px_rgba(0,0,0,0.28)] ${compact ? 'flex flex-col' : 'flex flex-col'}`}
      onMouseDown={() => onFocus?.()}
    >
      <header className={`shrink-0 border-b border-white/10 bg-[linear-gradient(180deg,#111827,#0A0A0A)] ${compact ? 'px-3 py-2.5' : 'px-4 py-3'}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`truncate font-semibold text-slate-100 ${compact ? 'text-xs' : 'text-sm'}`}>
                {title || workspaceName}
              </span>
              <span className={`rounded-full border px-2 py-0.5 uppercase tracking-wide ${statusClassName} ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
                {statusLabel}
              </span>
            </div>
            <p className={`truncate text-slate-500 ${compact ? 'mt-1 text-[10px]' : 'text-[11px]'}`} title={workspacePath}>
              {workspacePath}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                terminalRef.current?.clear();
                terminalRef.current?.focus();
                onFocus?.();
              }}
              className={`rounded-lg border border-white/10 text-slate-300 transition-colors hover:bg-white/5 ${compact ? 'px-2 py-1 text-[10px]' : 'px-2.5 py-1 text-xs'}`}
            >
              Limpar
            </button>
            <button
              onClick={onClose}
              className={`rounded-lg border border-rose-500/20 bg-rose-500/15 text-rose-200 transition-colors hover:bg-rose-500/25 ${compact ? 'px-2 py-1 text-[10px]' : 'px-2.5 py-1 text-xs'}`}
            >
              Encerrar
            </button>
          </div>
        </div>
      </header>

      {(localError || errorMessage) && (
        <div className="border-b border-red-500/20 bg-red-500/10 px-4 py-2 text-xs text-red-300">
          {localError || errorMessage}
        </div>
      )}

      <div className={`flex-1 min-h-0 ${compact ? 'p-2.5' : 'p-3'}`}>
        <div
          ref={containerRef}
          className="h-full w-full overflow-hidden rounded-[18px] border border-white/10 bg-[#050505]"
        />
      </div>
    </div>
  );
}
