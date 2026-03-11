import { AlertTriangle, Info } from 'lucide-react';
import { Dialog, DialogContent } from '@components/ui/dialog';
import { Button } from '@components/ui/button';

export function AppDialog({
  isOpen,
  type = 'alert',
  variant = 'info',
  title = '',
  message = '',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
}) {
  const isDanger = variant === 'danger';
  const Icon = isDanger ? AlertTriangle : Info;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel?.()}>
      <DialogContent className="overflow-hidden p-0">
          <div className="relative overflow-hidden rounded-[16px] bg-[color:var(--bg-surface)] border border-[color:var(--border-color)]">
          <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.1),transparent_70%)]" />
          <div className="relative space-y-6 p-7">
            <div className="flex items-start gap-4">
              <div className={`flex h-14 w-14 items-center justify-center rounded-[12px] border ${isDanger ? 'border-[color:var(--danger-color)]/30 bg-[color:var(--danger-color)]/10 text-[color:var(--danger-color)]' : 'border-[color:var(--primary-color)]/20 bg-[#eff6ff] text-[color:var(--primary-color)] dark:bg-[color:var(--primary-color)]/10'}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[color:var(--text-tertiary)]">
                  {isDanger ? 'Confirmacao critica' : 'Aviso do sistema'}
                </p>
                <h3 className="font-display text-2xl font-bold tracking-[-0.03em] text-[color:var(--text-primary)]">{title}</h3>
                <p className="max-w-md text-[0.95rem] leading-6 text-[color:var(--text-secondary)]">{message}</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              {type === 'confirm' && (
                <Button variant="secondary" onClick={onCancel}>
                  {cancelText}
                </Button>
              )}
              <Button variant={isDanger ? 'danger' : 'default'} onClick={onConfirm}>
                {confirmText}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
