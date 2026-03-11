import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@lib/utils';

export function Tabs(props) {
  return <TabsPrimitive.Root {...props} />;
}

export function TabsList({ className, ...props }) {
  return (
    <TabsPrimitive.List
      className={cn(
        'inline-flex h-[44px] items-center rounded-[12px] border border-[color:var(--border-color)] bg-[color:var(--bg-surface)] p-1 text-[color:var(--text-secondary)] shadow-sm backdrop-blur-xl',
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'inline-flex h-[36px] items-center justify-center rounded-[8px] px-4 text-[0.85rem] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] data-[state=active]:bg-[color:var(--bg-body)] data-[state=active]:text-[color:var(--text-primary)] data-[state=active]:shadow-sm hover:text-[color:var(--text-primary)] data-[state=active]:border data-[state=active]:border-[color:var(--border-color)]',
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }) {
  return (
    <TabsPrimitive.Content
      className={cn('mt-6 focus-visible:outline-none', className)}
      {...props}
    />
  );
}
