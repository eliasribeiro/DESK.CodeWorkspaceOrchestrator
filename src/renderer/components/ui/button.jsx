import { cva } from 'class-variance-authority';
import { cn } from '@lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary-color)] focus-visible:ring-offset-2 border disabled:pointer-events-none disabled:opacity-50 text-[0.95rem]',
  {
    variants: {
      variant: {
        default: 'bg-[color:var(--primary-color)] text-[color:var(--text-on-dark)] border-[color:var(--primary-color)] hover:bg-[color:var(--primary-hover)] hover:border-[color:var(--primary-hover)]',
        secondary: 'bg-[color:var(--bg-surface)] text-[color:var(--text-primary)] border-[color:var(--border-color)] hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600',
        ghost: 'border-transparent bg-transparent text-[color:var(--text-secondary)] hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[color:var(--text-primary)]',
        outline: 'border-[color:var(--border-color)] bg-transparent text-[color:var(--text-primary)] hover:bg-slate-50 dark:hover:bg-slate-800',
        danger: 'bg-red-100 dark:bg-red-900/30 text-[color:var(--danger-color)] border-transparent hover:bg-red-200 dark:hover:bg-red-900/50',
      },
      size: {
        default: 'h-[36px] px-4 py-2',
        sm: 'h-[28px] px-3 py-1 text-[0.85rem]',
        lg: 'h-[44px] px-6 py-2.5',
        icon: 'h-10 w-10 p-0 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export function Button({ className, variant, size, ...props }) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };
