import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@lib/utils';

export function Select(props) {
  return <SelectPrimitive.Root {...props} />;
}

export function SelectTrigger({ className, children, ...props }) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        'inline-flex h-[40px] w-full items-center justify-between rounded-[8px] border border-[color:var(--border-color)] bg-[color:var(--bg-surface)] px-3 text-[0.95rem] text-[color:var(--text-primary)] transition-all focus:outline-none focus:border-[color:var(--primary-color)] focus:ring-[3px] focus:ring-[color:var(--primary-color)]/10 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[color:var(--bg-body)]',
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="h-4 w-4 text-[color:var(--text-tertiary)]" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

export function SelectValue(props) {
  return <SelectPrimitive.Value {...props} />;
}

export function SelectContent({ className, children, ...props }) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        className={cn(
          'z-[130] overflow-hidden rounded-[8px] border border-[color:var(--border-color)] bg-[color:var(--bg-surface)] p-1 text-[color:var(--text-primary)] shadow-md',
          className,
        )}
        {...props}
      >
        <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

export function SelectItem({ className, children, ...props }) {
  return (
    <SelectPrimitive.Item
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-[6px] py-2 pl-8 pr-2 text-[0.95rem] outline-none transition-colors hover:bg-[color:var(--bg-body)] focus:bg-[color:var(--bg-body)] focus:text-[color:var(--primary-color)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-[color:var(--text-primary)]',
        className,
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="h-4 w-4 text-[color:var(--primary-color)]" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}
