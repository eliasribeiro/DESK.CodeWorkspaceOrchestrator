import { cn } from '@lib/utils';

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        'rounded-[12px] border border-[color:var(--border-color)] bg-[color:var(--bg-surface)] shadow-sm',
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return <div className={cn('flex flex-col gap-2 p-6 pb-4', className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return <h3 className={cn('font-display text-[1.1rem] font-semibold text-[color:var(--text-primary)]', className)} {...props} />;
}

export function CardDescription({ className, ...props }) {
  return <p className={cn('text-[0.9rem] leading-6 text-[color:var(--text-secondary)]', className)} {...props} />;
}

export function CardContent({ className, ...props }) {
  return <div className={cn('p-6 pt-0', className)} {...props} />;
}
