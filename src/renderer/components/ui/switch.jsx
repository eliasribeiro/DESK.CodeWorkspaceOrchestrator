import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '@lib/utils';

export function Switch({ className, ...props }) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        'peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border border-white/10 bg-white/10 transition-colors data-[state=checked]:bg-[color:var(--accent)] data-[state=unchecked]:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block h-5 w-5 translate-x-1 rounded-full bg-white shadow-lg transition-transform data-[state=checked]:translate-x-6" />
    </SwitchPrimitive.Root>
  );
}
