import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  AlertTriangle,
  MonitorCog,
  Play,
  Plus,
  RefreshCcw,
  Square,
  Trash2,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card';
import { Switch } from '@components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';

const strategyOptions = [
  { value: 'sticky', label: 'Sticky (Cache Optimized)' },
  { value: 'round-robin', label: 'Round Robin (Load Balanced)' },
  { value: 'hybrid', label: 'Hybrid (Smart Distribution)' },
];

export function ProxySettingsTab({
  proxyPort,
  onProxyPortChange,
  proxyAutoStart,
  onProxyAutoStartChange,
  proxyStrategy,
  onProxyStrategyChange,
}) {
  const [proxyStatus, setProxyStatus] = useState(null);
  const [accounts, setAccounts] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshingAccounts, setIsRefreshingAccounts] = useState(false);
  const portInputRef = useRef(null);

  const fetchStatus = useCallback(async () => {
    try {
      const status = await window.electronAPI.proxy.getStatus();
      setProxyStatus(status);
    } catch (_) {
      setProxyStatus(null);
    }
  }, []);

  const fetchAccounts = useCallback(async () => {
    try {
      const data = await window.electronAPI.proxy.getAccounts();
      setAccounts(data);
    } catch (_) {
      setAccounts(null);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const unsubscribe = window.electronAPI.proxy.onStatusChange((status) => {
      setProxyStatus(status);
    });
    return unsubscribe;
  }, [fetchStatus]);

  useEffect(() => {
    if (proxyStatus?.running) {
      fetchAccounts();
    }
  }, [proxyStatus?.running, fetchAccounts]);

  const handleStart = async () => {
    setIsLoading(true);
    try {
      await window.electronAPI.proxy.start({
        port: proxyPort || 8080,
        strategy: proxyStrategy || 'hybrid',
      });
      await fetchStatus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    setIsLoading(true);
    try {
      await window.electronAPI.proxy.stop();
      await fetchStatus();
      setAccounts(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshAccounts = async () => {
    setIsRefreshingAccounts(true);
    try {
      await fetchAccounts();
    } finally {
      setIsRefreshingAccounts(false);
    }
  };

  const handleAddAccount = async () => {
    await window.electronAPI.proxy.addAccount();
  };

  const handleRemoveAccount = async (email) => {
    await window.electronAPI.proxy.removeAccount(email);
    await fetchAccounts();
  };

  const isRunning = proxyStatus?.running === true;
  const statusColor = isRunning ? 'var(--success-color, #22c55e)' : 'var(--text-tertiary)';
  const StatusIcon = isRunning ? Wifi : WifiOff;

  const accountList = accounts?.accounts || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Warning Card */}
      <Card className="panel-edge border-[color:var(--warning-color,#f59e0b)]/30">
        <CardContent className="flex items-start gap-4 pt-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] bg-[color:var(--warning-color,#f59e0b)]/15 text-[color:var(--warning-color,#f59e0b)]">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-[color:var(--text-primary)]">Aviso — Termos de Serviço</p>
            <p className="mt-1 text-[0.85rem] leading-6 text-[color:var(--text-secondary)]">
              O uso deste proxy pode violar os Termos de Serviço do Google. Contas podem ser banidas ou
              restringidas. Recomenda-se usar uma conta secundária.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Proxy Control Card */}
      <Card className="panel-edge">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <MonitorCog className="h-5 w-5" />
            Antigravity — Servidor Proxy
          </CardTitle>
          <CardDescription>
            O <strong>Antigravity Proxy</strong> atua como intermediário entre o Claude Code CLI e o Google Cloud Code,
            permitindo usar modelos Claude e Gemini sem custo por API key. Configure a porta, estratégia de balanceamento
            e inicie o servidor antes de usar o provedor <em>Antigravity (Proxy)</em> no workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Status + Start/Stop */}
          <div className="flex flex-col gap-4 rounded-[24px] border border-[color:var(--border-color)] bg-[color:var(--bg-body)] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-[color:var(--border-color)] bg-[color:var(--bg-surface)]"
                style={{ color: statusColor }}
              >
                <StatusIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-[color:var(--text-primary)]">
                  {isRunning ? 'Rodando' : 'Parado'}
                </p>
                <p className="text-[0.85rem] text-[color:var(--text-secondary)]">
                  {isRunning
                    ? `Porta ${proxyStatus.port} · PID ${proxyStatus.pid}`
                    : 'O servidor proxy não está ativo'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isRunning ? (
                <Button variant="destructive" onClick={handleStop} disabled={isLoading}>
                  <Square className="h-4 w-4" />
                  {isLoading ? 'Parando...' : 'Parar'}
                </Button>
              ) : (
                <Button onClick={handleStart} disabled={isLoading}>
                  <Play className="h-4 w-4" />
                  {isLoading ? 'Iniciando...' : 'Iniciar'}
                </Button>
              )}
            </div>
          </div>

          {/* Port + Strategy + Auto-start */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[20px] border border-[color:var(--border-color)] bg-[color:var(--bg-body)] p-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--text-tertiary)]">
                Porta
              </p>
              <input
                ref={portInputRef}
                type="number"
                value={proxyPort || 8080}
                onChange={(event) => {
                  const parsed = parseInt(event.target.value, 10);
                  if (Number.isFinite(parsed) && parsed > 0 && parsed < 65536) {
                    onProxyPortChange?.(parsed);
                  }
                }}
                disabled={isRunning}
                className="h-10 w-full rounded-[8px] border border-[color:var(--border-color)] bg-[color:var(--bg-surface)] px-3 text-[0.95rem] text-[color:var(--text-primary)] outline-none transition focus:border-[color:var(--text-primary)] disabled:opacity-50"
              />
            </div>

            <div className="rounded-[20px] border border-[color:var(--border-color)] bg-[color:var(--bg-body)] p-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--text-tertiary)]">
                Estratégia
              </p>
              <Select value={proxyStrategy || 'hybrid'} onValueChange={onProxyStrategyChange} disabled={isRunning}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {strategyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center rounded-[20px] border border-[color:var(--border-color)] bg-[color:var(--bg-body)] p-4">
              <div className="flex flex-1 flex-col gap-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--text-tertiary)]">
                  Auto-start
                </p>
                <p className="text-[0.8rem] text-[color:var(--text-secondary)]">Iniciar com o app</p>
              </div>
              <Switch checked={proxyAutoStart || false} onCheckedChange={onProxyAutoStartChange} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Card */}
      <Card className="panel-edge">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-3">
              <Users className="h-5 w-5" />
              Contas Google
            </CardTitle>
            <CardDescription>
              Contas vinculadas via OAuth para autenticação com o Google Cloud Code.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleRefreshAccounts} disabled={!isRunning || isRefreshingAccounts}>
              <RefreshCcw className={`h-3.5 w-3.5 ${isRefreshingAccounts ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button onClick={handleAddAccount} disabled={!isRunning}>
              <Plus className="h-4 w-4" />
              Adicionar Conta
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {!isRunning && (
            <div className="rounded-[20px] border border-dashed border-[color:var(--border-color)] bg-[color:var(--bg-body)] p-8 text-center">
              <p className="text-[0.85rem] text-[color:var(--text-tertiary)]">
                Inicie o proxy para gerenciar contas.
              </p>
            </div>
          )}

          {isRunning && accountList.length === 0 && (
            <div className="rounded-[20px] border border-dashed border-[color:var(--border-color)] bg-[color:var(--bg-body)] p-8 text-center">
              <p className="font-semibold text-[color:var(--text-primary)]">Nenhuma conta vinculada</p>
              <p className="mt-2 text-[0.85rem] text-[color:var(--text-secondary)]">
                Clique em "Adicionar Conta" para vincular uma conta Google via OAuth.
              </p>
            </div>
          )}

          {isRunning &&
            accountList.map((account) => {
              const isBanned = account.status === 'banned';
              const isInvalid = account.status === 'invalid';
              const isError = account.status === 'error';
              const isOk = account.status === 'ok';

              return (
                <div
                  key={account.email}
                  className="flex items-center gap-4 rounded-[20px] border border-[color:var(--border-color)] bg-[color:var(--bg-body)] p-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-[color:var(--border-color)] bg-[color:var(--bg-surface)] font-semibold text-[color:var(--accent)]">
                    {(account.email || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-[color:var(--text-primary)]">{account.email}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.12em] ${
                          isOk
                            ? 'bg-green-500/15 text-green-400'
                            : isBanned
                              ? 'bg-red-500/15 text-red-400'
                              : isInvalid || isError
                                ? 'bg-yellow-500/15 text-yellow-400'
                                : 'bg-blue-500/15 text-blue-400'
                        }`}
                      >
                        <Activity className="h-2.5 w-2.5" />
                        {account.status}
                      </span>
                      {account.subscription?.tier && (
                        <span className="rounded-full border border-[color:var(--border-color)] bg-[color:var(--bg-surface)] px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[color:var(--text-secondary)]">
                          {account.subscription.tier}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveAccount(account.email)}
                    className="text-[color:var(--danger-color)] hover:bg-[color:var(--danger-color)]/10 hover:text-[color:var(--danger-color)]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
        </CardContent>
      </Card>
    </motion.div>
  );
}
