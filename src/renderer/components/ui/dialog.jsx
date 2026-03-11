import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@lib/utils';

export function Dialog(props) {
  return <DialogPrimitive.Root {...props} />;
}

export function DialogPortal(props) {
  return <DialogPrimitive.Portal {...props} />;
}

export function DialogOverlay({ className, ...props }) {
  return (
    <DialogPrimitive.Overlay
      className={cn('fixed inset-0 z-[120] bg-[rgba(5,10,18,0.74)] backdrop-blur-md', className)}
      {...props}
    />
  );
}

export function DialogContent({ className, ...props }) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-[121] w-[min(92vw,32rem)] -translate-x-1/2 -translate-y-1/2 rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(7,12,22,0.98))] p-0 shadow-[0_40px_120px_rgba(2,8,23,0.6)] focus-visible:outline-none',
          className,
        )}
        {...props}
      />
    </DialogPortal>
  );
}
