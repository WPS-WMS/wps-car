'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DialogFormContainerProvider } from './dialog-form-container';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

function isSelectPortalTarget(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(
      target.closest('[data-slot^="select-"]') ||
        target.closest('[data-base-ui-inert]'),
    )
  );
}

export function DialogContent({
  className,
  children,
  onPointerDownOutside,
  onFocusOutside,
  onInteractOutside,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-brand-950/40 backdrop-blur-[2px]" />
      <DialogPrimitive.Content
        ref={containerRef}
        className={cn(
          'fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl border border-brand-100 bg-white p-6 shadow-card-hover',
          className,
        )}
        onPointerDownOutside={(event) => {
          if (isSelectPortalTarget(event.target)) {
            event.preventDefault();
            return;
          }
          onPointerDownOutside?.(event);
        }}
        onFocusOutside={(event) => {
          if (isSelectPortalTarget(event.target)) {
            event.preventDefault();
            return;
          }
          onFocusOutside?.(event);
        }}
        onInteractOutside={(event) => {
          if (isSelectPortalTarget(event.target)) {
            event.preventDefault();
            return;
          }
          onInteractOutside?.(event);
        }}
        onCloseAutoFocus={(event) => {
          if (isSelectPortalTarget(document.activeElement)) {
            event.preventDefault();
          }
        }}
        {...props}
      >
        <DialogFormContainerProvider containerRef={containerRef}>
          {children}
        </DialogFormContainerProvider>
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-md p-1 text-brand-500 opacity-70 transition-opacity hover:bg-brand-50 hover:opacity-100">
          <X className="h-4 w-4" />
          <span className="sr-only">Fechar</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1 pr-8', className)} {...props} />;
}

export function DialogTitle({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn('text-lg font-semibold text-brand-950', className)}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn('text-sm text-brand-600', className)}
      {...props}
    />
  );
}
